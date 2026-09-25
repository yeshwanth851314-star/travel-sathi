import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Siren,
  PhoneCall,
  Clock,
  ShieldCheck,
  User,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIncidents, useEmergencyContacts } from "@/lib/queries";
import { getLocation } from "@/lib/geo";
import { StatusBadge, SeverityBadge } from "@/components/app/badges";
import { Timeline } from "@/components/app/Timeline";
import { MapView, type MapMarker } from "@/components/app/MapView";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { errMsg, type Status } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tourist/emergency")({
  head: () => ({
    meta: [{ title: "Active Emergency — Travel Sathi" }],
  }),
  component: ActiveEmergencyPage,
});

const PROGRESS_STEPS: { status: Status; label: string }[] = [
  { status: "submitted", label: "SOS Submitted" },
  { status: "received", label: "Received by System" },
  { status: "assigned", label: "Responder Assigned" },
  { status: "accepted", label: "Accepted by Responder" },
  { status: "en_route", label: "Responder En Route" },
  { status: "assistance_provided", label: "Assistance Provided" },
  { status: "resolved", label: "Incident Resolved" },
];

function ActiveEmergencyPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: incidents, isLoading } = useIncidents({ reporterId: user.id });
  const { data: contacts } = useEmergencyContacts(user.id);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updatingLoc, setUpdatingLoc] = useState(false);

  // Find active SOS first, or any active incident
  const activeIncident = (incidents ?? []).find(
    (i) =>
      (i.kind === "sos" || i.status !== "resolved") &&
      i.status !== "cancelled" &&
      i.status !== "resolved",
  );

  async function handleCancel() {
    if (!activeIncident) return;
    setCancelling(true);
    try {
      const { error } = await supabase.rpc("update_incident_status", {
        _incident_id: activeIncident.id,
        _status: "cancelled",
        _note: "Cancelled by tourist via active emergency screen.",
      });
      if (error) throw error;
      toast.success("Emergency incident has been cancelled.");
      setShowCancelDialog(false);
      navigate({ to: "/tourist" });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setCancelling(false);
    }
  }

  async function handleUpdateLocation() {
    if (!activeIncident) return;
    setUpdatingLoc(true);
    try {
      const geo = await getLocation(8000);
      if (!geo.ok) {
        toast.warning(geo.reason);
        return;
      }
      const { error } = await supabase.from("incident_locations").insert({
        incident_id: activeIncident.id,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        location_text: activeIncident.location_text ?? "Live SOS GPS update",
      });
      if (error) throw error;
      toast.success(`Live emergency coordinates updated (±${Math.round(geo.accuracy)}m)`);
      qc.invalidateQueries({ queryKey: ["incidents"] });
      qc.invalidateQueries({ queryKey: ["timeline", activeIncident.id] });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setUpdatingLoc(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeIncident) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground">No Active Emergency</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          You do not currently have any active emergency SOS signals or unresolved incident
          requests.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/tourist">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
          <Link to="/tourist/sos">
            <Button variant="destructive">
              <Siren className="mr-2 h-4 w-4" /> Trigger Emergency SOS
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ["submitted", "received", "assigned"].includes(activeIncident.status);

  const markers: MapMarker[] = [];
  if (activeIncident.latitude && activeIncident.longitude) {
    markers.push({
      id: activeIncident.id,
      lat: activeIncident.latitude,
      lng: activeIncident.longitude,
      label: `Emergency SOS: ${activeIncident.ref}`,
      kind: "incident",
      critical: true,
    });
  }

  // Calculate current progress index
  const currentStepIdx = PROGRESS_STEPS.findIndex((s) => s.status === activeIncident.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          to="/tourist"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive p-2.5 text-destructive-foreground animate-pulse">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                  Active Emergency Response
                </h1>
                <span className="font-mono text-sm font-semibold bg-muted px-2 py-0.5 rounded">
                  {activeIncident.ref}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Triggered at {format(new Date(activeIncident.created_at), "PPpp")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={activeIncident.severity} />
            <StatusBadge status={activeIncident.status} kind={activeIncident.kind} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpdateLocation}
              disabled={updatingLoc}
              className="text-xs gap-1.5"
            >
              {updatingLoc ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-primary" />
              )}
              Update Live GPS
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Status Alert Header */}
      <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>DISPATCH STATUS IN REALTIME</span>
          </div>
          <span className="text-xs font-semibold uppercase text-destructive tracking-wider animate-pulse">
            LIVE CHANNEL
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {activeIncident.status === "submitted" || activeIncident.status === "received"
            ? "Your emergency signal has been received by the Travel Sathi coordination desk. First responders in your zone are being notified."
            : activeIncident.status === "assigned"
              ? "A response unit has been assigned to your emergency ticket."
              : activeIncident.status === "accepted"
                ? "Your assigned responder has confirmed acceptance and is preparing dispatch."
                : activeIncident.status === "en_route"
                  ? "Responder is EN ROUTE to your reported location. Please keep your device active."
                  : activeIncident.status === "assistance_provided"
                    ? "Responder is on-site and assistance is currently being rendered."
                    : "Emergency response complete."}
        </p>
      </div>

      {/* Status Progression Bar */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Response Progression</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PROGRESS_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx;
            const isCurrent = currentStepIdx === idx;
            return (
              <div
                key={step.status}
                className={`rounded-xl p-2.5 text-center text-xs flex flex-col justify-between border transition-all ${
                  isCurrent
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs scale-102"
                    : isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "bg-muted/40 border-border text-muted-foreground opacity-60"
                }`}
              >
                <div className="mb-1 flex justify-center">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current" />
                  )}
                </div>
                <span className="leading-tight text-[11px]">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Map & Details / Responder */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Map & Location (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Reported Coordinates</h2>
              </div>
              <span className="text-xs text-muted-foreground">
                Accuracy:{" "}
                {activeIncident.accuracy ? `±${Math.round(activeIncident.accuracy)}m` : "Estimated"}
              </span>
            </div>

            {markers.length > 0 ? (
              <div className="rounded-xl overflow-hidden border">
                <MapView markers={markers} height={320} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground bg-muted/20">
                GPS coordinates were not provided for this alert. Landmark:{" "}
                <strong className="text-foreground">
                  {activeIncident.location_text || "Unspecified"}
                </strong>
              </div>
            )}

            {activeIncident.location_text && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs">
                <span className="font-semibold text-foreground">Location Landmark: </span>
                <span className="text-muted-foreground">{activeIncident.location_text}</span>
              </div>
            )}
          </div>

          {/* Live Timeline */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Live Activity Timeline</h2>
            </div>
            <Timeline incidentId={activeIncident.id} />
          </div>
        </div>

        {/* Right: Responder Info & Direct Helplines (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Responder Assignment Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Assigned Responder</h2>
            </div>

            {activeIncident.responder ? (
              <div className="rounded-xl bg-muted/50 p-4 space-y-2 border">
                <p className="font-semibold text-foreground text-sm">
                  {activeIncident.responder.full_name || "Official Unit"}
                </p>
                <p className="text-xs text-muted-foreground">{activeIncident.responder.email}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Certified Safety Responder
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground bg-muted/20">
                Awaiting responder assignment from dispatch center…
              </div>
            )}
          </div>

          {/* Direct Emergency Helplines */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-destructive" />
              <h2 className="text-base font-semibold text-foreground">
                Immediate Direct Helplines
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-xl border bg-destructive/10 text-destructive font-bold hover:bg-destructive/20 transition-colors"
              >
                <span>Police / 112</span>
                <PhoneCall className="h-3.5 w-3.5" />
              </a>
              <a
                href="tel:1363"
                className="flex items-center justify-between p-3 rounded-xl border bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
              >
                <span>Tourist / 1363</span>
                <PhoneCall className="h-3.5 w-3.5" />
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-xl border bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/20 transition-colors"
              >
                <span>Ambulance / 108</span>
                <PhoneCall className="h-3.5 w-3.5" />
              </a>
              <a
                href="tel:101"
                className="flex items-center justify-between p-3 rounded-xl border bg-muted font-bold hover:bg-muted/80 transition-colors"
              >
                <span>Fire / 101</span>
                <PhoneCall className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Designated Emergency Contacts */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Your Emergency Contacts</h2>
              <Link
                to="/tourist/contacts"
                className="text-xs text-primary hover:underline font-medium"
              >
                Manage
              </Link>
            </div>
            {!contacts?.length ? (
              <p className="text-xs text-muted-foreground">
                No emergency contacts registered.{" "}
                <Link to="/tourist/contacts" className="text-primary underline">
                  Add contacts
                </Link>{" "}
                to notify next of kin during alerts.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground block">{c.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {c.relationship || "Contact"}
                      </span>
                    </div>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="rounded bg-primary/10 px-2 py-1 font-semibold text-primary"
                      >
                        {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancel Incident Button if allowed */}
          {canCancel && (
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Cancel Emergency Request
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Emergency Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to cancel this emergency request? Responders will stand down.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Yes, Cancel Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
