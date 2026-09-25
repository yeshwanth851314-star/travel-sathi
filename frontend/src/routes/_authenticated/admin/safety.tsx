import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSafetyInfo } from "@/lib/queries";
import { errMsg, INFO_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge, VerifiedBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/safety")({
  component: AdminSafetyInfoPage,
});

interface SafetyFormState {
  title: string;
  category: string;
  content: string;
  source: string;
  review_date: string;
  is_published: boolean;
  is_verified: boolean;
}

const DEFAULT_FORM: SafetyFormState = {
  title: "",
  category: INFO_CATEGORIES[0] ?? "Tourist safety",
  content: "",
  source: "",
  review_date: "",
  is_published: true,
  is_verified: true,
};

function AdminSafetyInfoPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: articles, isLoading, error } = useSafetyInfo();

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SafetyFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["safety_info"] });

  const startAdd = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowAdd(true);
  };

  const startEdit = (a: NonNullable<typeof articles>[number]) => {
    setShowAdd(false);
    setEditingId(a.id);
    setForm({
      title: a.title,
      category: a.category,
      content: a.content,
      source: a.source ?? "",
      review_date: a.review_date ?? "",
      is_published: a.is_published,
      is_verified: a.is_verified,
    });
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        content: form.content.trim(),
        source: form.source.trim() || null,
        review_date: form.review_date || null,
        is_published: form.is_published,
        is_verified: form.is_verified,
        verified_at: form.is_verified ? new Date().toISOString() : null,
      };

      if (editingId) {
        const { error: uErr } = await supabase
          .from("safety_information")
          .update(payload)
          .eq("id", editingId);
        if (uErr) throw uErr;
        toast.success("Safety article updated.");
      } else {
        const { error: iErr } = await supabase.from("safety_information").insert({
          ...payload,
          created_by: user.id,
          is_demo: false,
        });
        if (iErr) throw iErr;
        toast.success("Safety article published.");
      }
      await invalidate();
      cancelForm();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const { error: uErr } = await supabase
        .from("safety_information")
        .update({ is_published: !current })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success(!current ? "Article published." : "Article unpublished.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleToggleVerify = async (id: string, current: boolean) => {
    try {
      const { error: uErr } = await supabase
        .from("safety_information")
        .update({
          is_verified: !current,
          verified_at: !current ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (uErr) throw uErr;
      toast.success(!current ? "Marked as verified." : "Verification removed.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete safety guide "${title}"?`)) return;
    try {
      const { error: dErr } = await supabase.from("safety_information").delete().eq("id", id);
      if (dErr) throw dErr;
      toast.success("Safety article deleted.");
      await invalidate();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Information Management"
        desc="Create, verify, and publish official emergency guidance and travel safety protocols."
      >
        {!showAdd && !editingId && (
          <Button onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> New Safety Guide
          </Button>
        )}
      </PageHeader>

      {(showAdd || editingId) && (
        <form onSubmit={handleSave} className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">
              {editingId ? "Edit Safety Information" : "Create Safety Information"}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-title">Title *</Label>
              <Input
                id="s-title"
                required
                placeholder="e.g. Lost Passport Emergency Protocol"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cat">Category *</Label>
              <select
                id="s-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 w-full rounded-md border bg-background px-2.5 text-sm"
              >
                {INFO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-source">Official Source / Authority</Label>
              <Input
                id="s-source"
                placeholder="e.g. Ministry of Tourism / State Police"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-review">Next Scheduled Review Date</Label>
              <Input
                id="s-review"
                type="date"
                value={form.review_date}
                onChange={(e) => setForm({ ...form, review_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-content">Guidance Content *</Label>
            <Textarea
              id="s-content"
              rows={5}
              required
              placeholder="Write clear, step-by-step instructions for tourists…"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                />
                Published to tourists
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_verified}
                  onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                />
                Verified by authority
              </label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                <Check className="h-4 w-4 mr-1.5" />
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Guide"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !(articles ?? []).length ? (
        <Empty title="No safety information articles yet" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(articles ?? []).map((a) => (
            <div
              key={a.id}
              className="rounded-xl border bg-card p-4 flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <VerifiedBadge verified={a.is_verified} />
                  <DemoBadge show={a.is_demo} />
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      a.is_published
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.is_published ? "Published" : "Draft"}
                  </span>
                  <span className="text-xs text-muted-foreground">{a.category}</span>
                </div>
                <h3 className="font-semibold text-base">{a.title}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-3">
                  {a.content.replace(/\\n/g, "\n")}
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Source: {a.source || "—"} · Updated {format(new Date(a.updated_at), "PP")}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(a.id, a.is_published)}
                  >
                    {a.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVerify(a.id, a.is_verified)}
                  >
                    {a.is_verified ? "Unverify" : "Verify"}
                  </Button>
                </div>
                <div className="flex items-center gap-1">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
