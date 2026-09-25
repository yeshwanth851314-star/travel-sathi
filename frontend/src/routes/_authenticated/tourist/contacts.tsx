import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Phone, Plus, Star, Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEmergencyContacts } from "@/lib/queries";
import { errMsg } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/tourist/contacts")({
  component: EmergencyContactsPage,
});

interface ContactFormState {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  priority: number;
  is_primary: boolean;
  is_active: boolean;
}

const DEFAULT_FORM: ContactFormState = {
  name: "",
  relationship: "",
  phone: "",
  email: "",
  priority: 1,
  is_primary: false,
  is_active: true,
};

function EmergencyContactsPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: contacts, isLoading, error } = useEmergencyContacts(user.id);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["emergency_contacts", user.id] });

  const startAdd = () => {
    setEditingId(null);
    setForm({
      ...DEFAULT_FORM,
      priority: (contacts?.length ?? 0) + 1,
      is_primary: (contacts?.length ?? 0) === 0,
    });
    setShowAdd(true);
  };

  const startEdit = (c: NonNullable<typeof contacts>[number]) => {
    setShowAdd(false);
    setEditingId(c.id);
    setForm({
      name: c.name,
      relationship: c.relationship ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      priority: c.priority,
      is_primary: c.is_primary,
      is_active: c.is_active,
    });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      if (form.is_primary && contacts?.length) {
        await supabase
          .from("emergency_contacts")
          .update({ is_primary: false })
          .eq("user_id", user.id);
      }

      if (editingId) {
        const { error: uErr } = await supabase
          .from("emergency_contacts")
          .update({
            name: form.name.trim(),
            relationship: form.relationship.trim() || null,
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            priority: Number(form.priority) || 1,
            is_primary: form.is_primary,
            is_active: form.is_active,
          })
          .eq("id", editingId)
          .eq("user_id", user.id);
        if (uErr) throw uErr;
        toast.success("Emergency contact updated.");
      } else {
        const { error: iErr } = await supabase.from("emergency_contacts").insert({
          user_id: user.id,
          name: form.name.trim(),
          relationship: form.relationship.trim() || null,
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          priority: Number(form.priority) || 1,
          is_primary: form.is_primary,
          is_active: form.is_active,
        });
        if (iErr) throw iErr;
        toast.success("Emergency contact added.");
      }
      await invalidate();
      cancelForm();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await supabase
        .from("emergency_contacts")
        .update({ is_primary: false })
        .eq("user_id", user.id);
      const { error: uErr } = await supabase
        .from("emergency_contacts")
        .update({ is_primary: true })
        .eq("id", id)
        .eq("user_id", user.id);
      if (uErr) throw uErr;
      toast.success("Primary contact updated.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete emergency contact "${name}"?`)) return;
    try {
      const { error: dErr } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (dErr) throw dErr;
      toast.success("Contact removed.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Contacts"
        desc="Trusted family members or companions responders can reach if you trigger SOS or require urgent assistance."
      >
        {!showAdd && !editingId && (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Contact
          </Button>
        )}
      </PageHeader>

      {(showAdd || editingId) && (
        <form onSubmit={handleSave} className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              {editingId ? "Edit Emergency Contact" : "New Emergency Contact"}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Full Name *</Label>
              <Input
                id="c-name"
                required
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-rel">Relationship</Label>
              <Input
                id="c-rel"
                placeholder="e.g. Spouse, Parent, Friend, Tour Leader"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone Number *</Label>
              <Input
                id="c-phone"
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email Address</Label>
              <Input
                id="c-email"
                type="email"
                placeholder="contact@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-prio">Call Priority (1 = highest)</Label>
              <Input
                id="c-prio"
                type="number"
                min={1}
                max={10}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="flex flex-col justify-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                />
                Primary emergency contact
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Active for emergency notifications
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={cancelForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Check className="h-4 w-4 mr-1.5" />
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Contact"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !contacts?.length ? (
        <Empty
          title="No emergency contacts saved yet"
          hint="Add at least one trusted contact so responders know whom to reach during an emergency."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border bg-card p-4 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      #{c.priority}
                    </span>
                    <h3 className="font-semibold text-base">{c.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.is_primary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                        <Star className="h-3 w-3 fill-current" /> Primary
                      </span>
                    )}
                    {!c.is_active && (
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                {c.relationship && (
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.relationship}
                  </p>
                )}
                <p className="text-sm font-medium pt-1">{c.phone}</p>
                {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <a
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" /> Call Now
                </a>

                <div className="flex items-center gap-1">
                  {!c.is_primary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(c.id)}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" /> Set Primary
                    </Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(c)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id, c.name)}
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
