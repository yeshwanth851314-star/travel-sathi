import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAlerts } from "@/lib/queries";
import { errMsg, SEVERITIES, type Severity } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge, SeverityBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/alerts")({
  component: AdminAlertsPage,
});

interface AlertFormState {
  title: string;
  message: string;
  severity: Severity;
  area: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const DEFAULT_FORM: AlertFormState = {
  title: "",
  message: "",
  severity: "medium",
  area: "",
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: "",
  is_active: true,
};

function AdminAlertsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: alerts, isLoading, error } = useAlerts(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AlertFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["alerts"] });

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, starts_at: new Date().toISOString().slice(0, 16) });
    setShowAdd(true);
  };

  const startEdit = (a: NonNullable<typeof alerts>[number]) => {
    setShowAdd(false);
    setEditingId(a.id);
    setForm({
      title: a.title,
      message: a.message,
      severity: a.severity,
      area: a.area ?? "",
      starts_at: a.starts_at ? new Date(a.starts_at).toISOString().slice(0, 16) : "",
      ends_at: a.ends_at ? new Date(a.ends_at).toISOString().slice(0, 16) : "",
      is_active: a.is_active,
    });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Alert title and message are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        severity: form.severity,
        area: form.area.trim() || null,
        starts_at: form.starts_at
          ? new Date(form.starts_at).toISOString()
          : new Date().toISOString(),
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error: uErr } = await supabase
          .from("safety_alerts")
          .update(payload)
          .eq("id", editingId);
        if (uErr) throw uErr;
        toast.success("Safety alert updated.");
      } else {
        const { error: iErr } = await supabase.from("safety_alerts").insert({
          ...payload,
          created_by: user.id,
          is_demo: false,
        });
        if (iErr) throw iErr;
        toast.success("Safety alert broadcast published.");
      }
      await invalidate();
      cancelForm();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const { error: uErr } = await supabase
        .from("safety_alerts")
        .update({ is_active: !current })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success(!current ? "Alert activated." : "Alert deactivated.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete safety alert "${title}"?`)) return;
    try {
      const { error: dErr } = await supabase.from("safety_alerts").delete().eq("id", id);
      if (dErr) throw dErr;
      toast.success("Safety alert deleted.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Alerts & Broadcasts"
        desc="Publish regional advisories, weather warnings, and emergency notifications to all tourists."
      >
        {!showAdd && !editingId && (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Broadcast Alert
          </Button>
        )}
      </PageHeader>

      {(showAdd || editingId) && (
        <form onSubmit={handleSave} className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              {editingId ? "Edit Safety Alert" : "Broadcast New Safety Alert"}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="al-title">Alert Title *</Label>
              <Input
                id="al-title"
                required
                placeholder="e.g. Heavy Monsoon Rainfall Advisory"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al-sev">Severity *</Label>
              <select
                id="al-sev"
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="al-area">Affected Area / District</Label>
              <Input
                id="al-area"
                placeholder="e.g. Old City / Coastal Highway"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="al-start">Starts At</Label>
                <Input
                  id="al-start"
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="al-end">Expires At (optional)</Label>
                <Input
                  id="al-end"
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="al-msg">Advisory Message *</Label>
            <Textarea
              id="al-msg"
              rows={3}
              required
              placeholder="Provide actionable safety precautions and alternative routes…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active broadcast
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Check className="h-4 w-4 mr-1.5" />
                {saving ? "Saving…" : editingId ? "Save Changes" : "Publish Alert"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !(alerts ?? []).length ? (
        <Empty title="No safety alerts created yet" />
      ) : (
        <div className="space-y-3">
          {(alerts ?? []).map((a) => (
            <div
              key={a.id}
              className="rounded-xl border-l-4 border-l-warning border bg-card p-4 flex flex-wrap items-start justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1.5 flex-1 min-w-[240px]">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <DemoBadge show={a.is_demo} />
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase ${
                      a.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.is_active ? "Active" : "Inactive"}
                  </span>
                  <h3 className="font-semibold text-base">{a.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{a.message}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {a.area && <span>Area: {a.area}</span>}
                  <span>Starts: {format(new Date(a.starts_at), "PP p")}</span>
                  {a.ends_at && <span>Expires: {format(new Date(a.ends_at), "PP p")}</span>}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(a.id, a.is_active)}
                >
                  {a.is_active ? "Deactivate" : "Activate"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(a)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(a.id, a.title)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
