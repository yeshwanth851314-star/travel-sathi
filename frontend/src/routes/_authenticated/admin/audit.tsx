import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useAuditLogs } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AdminAuditLogsPage,
});

function AdminAuditLogsPage() {
  const { data: logs, isLoading, error } = useAuditLogs();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const actions = useMemo(
    () => Array.from(new Set((logs ?? []).map((l) => l.action))).sort(),
    [logs],
  );
  const entities = useMemo(
    () => Array.from(new Set((logs ?? []).map((l) => l.entity))).sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    return (logs ?? [])
      .filter((l) => !actionFilter || l.action === actionFilter)
      .filter((l) => !entityFilter || l.entity === entityFilter)
      .filter((l) => !dateFilter || l.created_at.startsWith(dateFilter))
      .filter((l) => {
        if (!search) return true;
        const hay =
          `${l.action} ${l.entity} ${l.entity_id ?? ""} ${l.actor?.full_name ?? ""} ${l.actor?.email ?? ""} ${JSON.stringify(l.details)}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      });
  }, [logs, actionFilter, entityFilter, dateFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable Audit History"
        desc="Read-only security and operational audit trail of SOS activations, status transitions, responder assignments, and role changes."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-2xs">
        <Input
          placeholder="Search actor, entity ID, details…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by entity"
        >
          <option value="">All entities</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-auto"
          aria-label="Filter by date"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !filtered.length ? (
        <Empty title="No audit log entries match your filter" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss")}
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-medium">
                      {l.actor?.full_name || l.actor?.email || "System / User"}
                    </div>
                    {l.actor?.email && l.actor?.full_name && (
                      <div className="text-muted-foreground">{l.actor.email}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    <span className="font-semibold uppercase">{l.entity}</span>
                    {l.entity_id && (
                      <span className="block font-mono text-[11px] text-muted-foreground truncate max-w-[180px]">
                        {l.entity_id}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground max-w-md truncate">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
