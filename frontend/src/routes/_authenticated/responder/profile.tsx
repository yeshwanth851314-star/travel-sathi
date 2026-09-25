import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/queries";
import { errMsg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/profile")({
  component: ResponderProfilePage,
});

function ResponderProfilePage() {
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
      toast.success("Responder profile updated.");
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
        title="Responder Profile"
        desc="Manage your responder display name and direct dispatch phone number."
      />

      <form onSubmit={handleSave} className="rounded-xl border bg-card p-6 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <Label htmlFor="r-email">Official Account Email</Label>
          <Input id="r-email" value={user.email ?? ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-role">Assigned Role</Label>
          <Input id="r-role" value="Verified Emergency Responder" disabled className="bg-muted" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-name">Responder Full Name / Callsign</Label>
          <Input
            id="r-name"
            placeholder="e.g. Inspector Rajesh Verma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-phone">Direct Dispatch Phone Number</Label>
          <Input
            id="r-phone"
            type="tel"
            placeholder="+91 98765 43210"
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
