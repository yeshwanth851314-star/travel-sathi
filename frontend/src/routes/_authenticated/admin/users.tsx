import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllUsers } from "@/lib/queries";
import { errMsg, type Role } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { user: currentUser } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: users, isLoading, error } = useAllUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return (users ?? [])
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) => {
        if (!search) return true;
        return `${u.full_name} ${u.email ?? ""} ${u.phone ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());
      });
  }, [users, roleFilter, search]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (userId === currentUser.id && newRole !== "admin") {
      toast.error("You cannot remove your own admin role.");
      return;
    }
    setUpdatingId(userId);
    try {
      const { error: rpcErr } = await supabase.rpc("set_user_role", {
        _user_id: userId,
        _role: newRole,
      });
      if (rpcErr) throw rpcErr;
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["all_users"] }),
        qc.invalidateQueries({ queryKey: ["audit_logs"] }),
      ]);
      toast.success(`User role updated to ${newRole}.`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Responder Role Management"
        desc="Manage registered tourists, promote verified emergency responders, and govern administrator access."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-2xs">
        <Input
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="tourist">Tourist</option>
          <option value="responder">Responder</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !filtered.length ? (
        <Empty title="No users match your search" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Full Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Current Role</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((u) => {
                const isSelf = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-3 font-medium">
                      {u.full_name || "—"}
                      {isSelf && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                          u.role === "admin"
                            ? "bg-destructive/10 text-destructive"
                            : u.role === "responder"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {u.role !== "tourist" && <ShieldCheck className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {format(new Date(u.created_at), "PP")}
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        disabled={updatingId === u.id || isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        className="h-8 rounded-md border bg-background px-2 text-xs font-medium disabled:opacity-50"
                        aria-label={`Change role for ${u.full_name || u.email}`}
                      >
                        <option value="tourist">Tourist</option>
                        <option value="responder">Responder</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
