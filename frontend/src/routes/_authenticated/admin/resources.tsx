import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useResources } from "@/lib/queries";
import { errMsg, RESOURCE_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge, VerifiedBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/resources")({
  component: AdminResourcesPage,
});

interface ResourceFormState {
  name: string;
  type: string;
  phone: string;
  address: string;
  operating_hours: string;
  latitude: string;
  longitude: string;
  is_verified: boolean;
}

const DEFAULT_FORM: ResourceFormState = {
  name: "",
  type: RESOURCE_TYPES[0] ?? "Police",
  phone: "",
  address: "",
  operating_hours: "24/7",
  latitude: "",
  longitude: "",
  is_verified: true,
};

function AdminResourcesPage() {
  const qc = useQueryClient();
  const { data: resources, isLoading, error } = useResources();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["resources"] });

  const startAdd = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowAdd(true);
  };

  const startEdit = (r: NonNullable<typeof resources>[number]) => {
    setShowAdd(false);
    setEditingId(r.id);
    setForm({
      name: r.name,
      type: r.type,
      phone: r.phone ?? "",
      address: r.address ?? "",
      operating_hours: r.operating_hours ?? "",
      latitude: r.latitude !== null ? String(r.latitude) : "",
      longitude: r.longitude !== null ? String(r.longitude) : "",
      is_verified: r.is_verified,
    });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Resource name is required.");
      return;
    }
    setSaving(true);
    try {
      const lat = form.latitude.trim() ? Number(form.latitude) : null;
      const lng = form.longitude.trim() ? Number(form.longitude) : null;
      const payload = {
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        operating_hours: form.operating_hours.trim() || null,
        latitude: lat !== null && !Number.isNaN(lat) ? lat : null,
        longitude: lng !== null && !Number.isNaN(lng) ? lng : null,
        is_verified: form.is_verified,
        last_verified_at: form.is_verified ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error: uErr } = await supabase
          .from("emergency_resources")
          .update(payload)
          .eq("id", editingId);
        if (uErr) throw uErr;
        toast.success("Emergency resource updated.");
      } else {
        const { error: iErr } = await supabase.from("emergency_resources").insert({
          ...payload,
          is_demo: false,
        });
        if (iErr) throw iErr;
        toast.success("Emergency resource added.");
      }
      await invalidate();
      cancelForm();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerify = async (id: string, current: boolean) => {
    try {
      const { error: uErr } = await supabase
        .from("emergency_resources")
        .update({
          is_verified: !current,
          last_verified_at: !current ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success(!current ? "Resource verified." : "Verification removed.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete emergency resource "${name}"?`)) return;
    try {
      const { error: dErr } = await supabase.from("emergency_resources").delete().eq("id", id);
      if (dErr) throw dErr;
      toast.success("Resource deleted.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Resources Directory"
        desc="Manage hospitals, police stations, embassies, and tourist assistance centers displayed across maps and directories."
      >
        {!showAdd && !editingId && (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Resource
          </Button>
        )}
      </PageHeader>

      {(showAdd || editingId) && (
        <form onSubmit={handleSave} className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              {editingId ? "Edit Emergency Resource" : "Add Emergency Resource"}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="er-name">Facility Name *</Label>
              <Input
                id="er-name"
                required
                placeholder="e.g. Tourist Police Headquarters"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-type">Type *</Label>
              <select
                id="er-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-phone">Emergency Phone</Label>
              <Input
                id="er-phone"
                placeholder="e.g. 112 or +91 141 2619051"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-hours">Operating Hours</Label>
              <Input
                id="er-hours"
                placeholder="e.g. 24/7 or 09:00–18:00"
                value={form.operating_hours}
                onChange={(e) => setForm({ ...form, operating_hours: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="er-addr">Street Address</Label>
              <Input
                id="er-addr"
                placeholder="Full address for tourist directions"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-lat">Latitude</Label>
              <Input
                id="er-lat"
                type="number"
                step="any"
                placeholder="e.g. 28.6315"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="er-lng">Longitude</Label>
              <Input
                id="er-lng"
                type="number"
                step="any"
                placeholder="e.g. 77.2167"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_verified}
                onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
              />
              Verified emergency resource
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Check className="h-4 w-4 mr-1.5" />
                {saving ? "Saving…" : editingId ? "Save Changes" : "Add Resource"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !(resources ?? []).length ? (
        <Empty title="No emergency resources in directory" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(resources ?? []).map((r) => (
            <div
              key={r.id}
              className="rounded-xl border bg-card p-4 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-primary">{r.type}</span>
                  <VerifiedBadge verified={r.is_verified} />
                  <DemoBadge show={r.is_demo} />
                </div>
                <h3 className="font-semibold text-base">{r.name}</h3>
                {r.address && <p className="text-sm text-muted-foreground">{r.address}</p>}
                <p className="text-xs text-muted-foreground">
                  Phone: <strong className="text-foreground">{r.phone || "—"}</strong> · Hours:{" "}
                  {r.operating_hours || "—"}
                </p>
                {r.latitude !== null && r.longitude !== null && (
                  <p className="text-xs font-mono text-muted-foreground">
                    Coords: {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleVerify(r.id, r.is_verified)}
                >
                  {r.is_verified ? "Mark Unverified" : "Mark Verified"}
                </Button>
                <div className="flex items-center gap-1">
                  <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(r)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(r.id, r.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
