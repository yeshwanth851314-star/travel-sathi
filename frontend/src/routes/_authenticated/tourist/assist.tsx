import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { LifeBuoy, ArrowLeft, Loader2, CheckCircle2, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLocation } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANCE_CATEGORIES, SEVERITIES, errMsg, type Severity } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tourist/assist")({
  head: () => ({
    meta: [{ title: "Request Assistance — Travel Sathi" }],
  }),
  component: RequestAssistancePage,
});

function RequestAssistancePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const [category, setCategory] = useState<string>(
    ASSISTANCE_CATEGORIES[0] ?? "Medical assistance",
  );
  const [severity, setSeverity] = useState<Severity>("low");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [contactInfo, setContactInfo] = useState("");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please describe what assistance you need.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: incident, error } = await supabase
        .from("incidents")
        .insert({
          reporter_id: user.id,
          kind: "assistance",
          category,
          severity,
          description: description.trim(),
          location_text: locationText.trim() || null,
          contact_info: contactInfo.trim() || null,
          latitude: lat,
          longitude: lng,
          accuracy,
          location_sharing: lat !== null,
          status: "submitted",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Assistance request logged (${incident.ref})`);
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
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
            <LifeBuoy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              Request Tourist Assistance
            </h1>
            <p className="text-sm text-muted-foreground">
              Need non-critical support? Contact tourist guides, medical aid, or consular
              information.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Type of Assistance</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ASSISTANCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Urgency / Severity */}
          <div className="space-y-1.5">
            <Label htmlFor="severity">Urgency Level</Label>
            <select
              id="severity"
              className="flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground capitalize focus:ring-2 focus:ring-primary focus:outline-none"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} Priority
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5">
          <Label htmlFor="contactInfo">Preferred Contact Phone / Details (Optional)</Label>
          <Input
            id="contactInfo"
            placeholder="e.g. +91 98765 43210 or WhatsApp number"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">How can our support team assist you?</Label>
          <Textarea
            id="description"
            rows={4}
            required
            maxLength={4000}
            placeholder="Please detail your request (e.g. stranded due to transit cancellation, need English-speaking doctor, lost passport advisory)…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Location Section */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="locationText">Where are you located currently?</Label>
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
                  <Navigation className="h-3.5 w-3.5 text-blue-600" />
                  {lat ? "Update GPS" : "Attach Current GPS"}
                </>
              )}
            </Button>
          </div>

          <Input
            id="locationText"
            placeholder="e.g. Airport Information Counter, Metro station ticket counter"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />

          {lat !== null && lng !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 p-2.5 text-xs text-blue-700 dark:text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                GPS Tagged: {lat.toFixed(5)}, {lng.toFixed(5)}{" "}
                {accuracy ? `(±${Math.round(accuracy)}m)` : ""}
              </span>
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
                Sending Assistance Request…
              </>
            ) : (
              "Submit Assistance Request"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
