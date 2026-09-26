import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/queries";
import { errMsg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/profile")({
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: profile, isLoading, error } = useProfile(user.id);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error: uErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || "",
          phone: phone.trim() || null,
        })
        .eq("id", user.id);
      if (uErr) throw uErr;
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Administrator profile updated.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Administrator Profile"
        desc="Manage your administrator display name and command contact details."
      />

      <form onSubmit={handleSave} className="rounded-xl border bg-card p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" />
          System Administrator Account
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-email">Account Email</Label>
          <Input id="a-email" value={user.email ?? ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-role">Assigned Role</Label>
          <Input id="a-role" value="Administrator" disabled className="bg-muted" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-name">Full Name</Label>
          <Input
            id="a-name"
            placeholder="e.g. Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-phone">Contact Phone Number</Label>
          <Input
            id="a-phone"
            type="tel"
            placeholder="+91 98765 00001"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
