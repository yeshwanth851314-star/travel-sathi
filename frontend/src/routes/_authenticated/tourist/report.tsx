import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileWarning, ArrowLeft, Loader2, CheckCircle2, Navigation, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLocation } from "@/lib/geo";
import { uploadEvidenceFile, validateEvidenceFile } from "@/lib/evidence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INCIDENT_CATEGORIES, SEVERITIES, errMsg, type Severity } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tourist/report")({
  head: () => ({
    meta: [{ title: "Report an Incident — Travel Sathi" }],
  }),
  component: ReportIncidentPage,
});

function ReportIncidentPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const [category, setCategory] = useState<string>(INCIDENT_CATEGORIES[0] ?? "Theft");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleGetLocation() {
    setGettingLocation(true);
    try {
      const res = await getLocation(8000);
      if (res.ok) {
        setLat(res.latitude);
        setLng(res.longitude);
        setAccuracy(res.accuracy);
        toast.success(`Coordinates captured (±${Math.round(res.accuracy)}m)`);
      } else {
        toast.warning(res.reason);
      }
    } catch {
      toast.error("Could not obtain device location.");
    } finally {
      setGettingLocation(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setEvidenceFile(null);
      return;
    }
    const check = validateEvidenceFile(file);
    if (!check.ok) {
      toast.error(check.error);
      e.target.value = "";
      return;
    }
    setEvidenceFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe what happened.");
      return;
    }

    setSubmitting(true);
    try {
      let evidencePath: string | null = null;
      if (evidenceFile) {
        try {
          evidencePath = await uploadEvidenceFile(user.id, evidenceFile);
        } catch (uploadErr) {
          toast.warning(`Evidence upload skipped: ${errMsg(uploadErr)}`);
        }
      }

      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          reporter_id: user.id,
          kind: "incident",
          category,
          severity,
          description: description.trim(),
          location_text: locationText.trim() || null,
          contact_info: contactInfo.trim() || null,
          evidence_path: evidencePath,
          latitude: lat,
          longitude: lng,
          accuracy,
          location_sharing: lat !== null,
          status: "submitted",
          occurred_at: new Date(occurredAt).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Incident reported successfully (${incident.ref})`);
      navigate({
        to: "/tourist/incidents/$incidentId",
        params: { incidentId: incident.id },
      });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          to="/tourist"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <FileWarning className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Report an Incident
            </h1>
            <p className="text-sm text-muted-foreground">
              Submit details about theft, property loss, harassment, or safety hazards.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Incident Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {INCIDENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label htmlFor="severity">Severity Level</Label>
            <select
              id="severity"
              className="flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground capitalize focus:ring-2 focus:ring-primary focus:outline-none"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} Severity
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* When it happened & Contact Info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="occurredAt">Approximate Time of Occurrence</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactInfo">Callback Phone / Contact (Optional)</Label>
            <Input
              id="contactInfo"
              placeholder="e.g. +91 98765 43210 or Hotel Room #"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Detailed Description of Incident</Label>
          <Textarea
            id="description"
            rows={4}
            required
            maxLength={4000}
            placeholder="Please detail what occurred, individuals involved, any identifiable features, or property lost…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Location Section */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="locationText">Location & Landmarks</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={gettingLocation}
              className="h-8 gap-1.5 text-xs"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Locating…
                </>
              ) : (
                <>
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                  {lat ? "Update Current GPS" : "Attach Current GPS"}
                </>
              )}
            </Button>
          </div>

          <Input
            id="locationText"
            placeholder="e.g. Near West Gate of Qutub Minar, near metro exit 2"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />

          {lat !== null && lng !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                GPS Tagged: {lat.toFixed(5)}, {lng.toFixed(5)}{" "}
                {accuracy ? `(±${Math.round(accuracy)}m)` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Optional Evidence Upload */}
        <div className="space-y-2 pt-2 border-t">
          <Label htmlFor="evidence" className="flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5 text-primary" /> Supporting Photo / Document (Optional)
          </Label>
          <Input
            id="evidence"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Accepted formats: JPG, PNG, WEBP, or PDF (Max 10 MB). Stored securely for authorized
            responders only.
          </p>
          {evidenceFile && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-xs">
              <span className="truncate font-medium">
                {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(0)} KB)
              </span>
              <button
                type="button"
                onClick={() => setEvidenceFile(null)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="pt-3">
          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Report…
              </>
            ) : (
              "Submit Incident Report"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
