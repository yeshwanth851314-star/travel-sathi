import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  ShieldCheck,
  XCircle,
  Loader2,
  Calendar,
  Navigation,
  FileText,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIncident } from "@/lib/queries";
import { getLocation } from "@/lib/geo";
import { useEvidenceUrl } from "@/lib/evidence";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Timeline } from "@/components/app/Timeline";
import { MapView, type MapMarker } from "@/components/app/MapView";
import { Loading, ErrorState, Empty } from "@/components/app/states";
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
import { errMsg, isActive } from "@/lib/constants";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tourist/incidents/$incidentId")({
  head: () => ({
    meta: [{ title: "Incident Details — Travel Sathi" }],
  }),
  component: TouristIncidentDetailPage,
});

function TouristIncidentDetailPage() {
  const { incidentId } = Route.useParams();
  const qc = useQueryClient();
  const { data: incident, isLoading, error } = useIncident(incidentId);
  const { data: evidenceUrl } = useEvidenceUrl(incident?.evidence_path);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [updatingLoc, setUpdatingLoc] = useState(false);

  async function handleCancel() {
    if (!incident) return;
    setCancelling(true);
    try {
      const { error } = await supabase.rpc("update_incident_status", {
        _incident_id: incident.id,
        _status: "cancelled",
        _note: "Cancelled by tourist.",
      });
      if (error) throw error;
      toast.success("Incident cancelled.");
      setShowCancelDialog(false);
      qc.invalidateQueries({ queryKey: ["incident", incidentId] });
      qc.invalidateQueries({ queryKey: ["timeline", incidentId] });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setCancelling(false);
    }
  }

  async function handleShareLocation() {
    if (!incident) return;
    setUpdatingLoc(true);
    try {
      const geo = await getLocation(8000);
      if (!geo.ok) {
        toast.warning(geo.reason);
        return;
      }
      const { error } = await supabase.from("incident_locations").insert({
        incident_id: incident.id,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: geo.accuracy,
        location_text: incident.location_text ?? "Updated live GPS coordinates",
      });
      if (error) throw error;
      toast.success(`Live coordinates updated (±${Math.round(geo.accuracy)}m)`);
      qc.invalidateQueries({ queryKey: ["incident", incidentId] });
      qc.invalidateQueries({ queryKey: ["timeline", incidentId] });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setUpdatingLoc(false);
    }
  }

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!incident) return <Empty title="Incident not found" />;

  const canCancel = ["submitted", "received", "assigned"].includes(incident.status);
  const active = isActive(incident.status);

  const markers: MapMarker[] = [];
  if (incident.latitude && incident.longitude) {
    markers.push({
      id: incident.id,
      lat: incident.latitude,
      lng: incident.longitude,
      label: `${incident.ref}: ${incident.category}`,
      kind: "incident",
      critical: incident.severity === "critical",
    });
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <Link
          to="/tourist/incidents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Incidents List
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold bg-muted px-2.5 py-0.5 rounded text-foreground">
                {incident.ref}
              </span>
              <SeverityBadge severity={incident.severity} />
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                {incident.kind}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground mt-1">
              {incident.category}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={incident.status} kind={incident.kind} />
            {active && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLocation}
                disabled={updatingLoc}
                className="text-xs gap-1.5"
              >
                {updatingLoc ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                )}
                Update Live Location
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowCancelDialog(true)}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Cancel Request
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Banner if Resolved or Cancelled */}
      {(incident.status === "resolved" || incident.status === "cancelled") && (
        <div
          className={`rounded-2xl border p-4 space-y-1 ${
            incident.status === "resolved"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              : "bg-muted border-border text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {incident.status === "resolved" ? "Incident Resolved" : "Incident Cancelled"}
              {incident.resolved_at ? ` on ${format(new Date(incident.resolved_at), "PPpp")}` : ""}
            </span>
          </div>
          {incident.resolution && (
            <p className="text-xs leading-relaxed">
              <strong>Resolution Note:</strong> {incident.resolution}
            </p>
          )}
        </div>
      )}

      {/* Main Grid: Details, Map, Timeline */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column (7 cols): Description, Location Map, Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Description Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-semibold text-foreground">Incident Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {incident.description || "No written description provided."}
            </p>

            {incident.contact_info && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <span className="font-semibold text-foreground">Callback / Contact Info: </span>
                <span className="text-muted-foreground">{incident.contact_info}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs text-muted-foreground">
              <div className="space-y-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Reported At
                </span>
                <span className="font-medium text-foreground">
                  {format(new Date(incident.created_at), "PPpp")}
                </span>
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Occurred At
                </span>
                <span className="font-medium text-foreground">
                  {incident.occurred_at
                    ? format(new Date(incident.occurred_at), "PPpp")
                    : "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Evidence Attachment Card */}
          {incident.evidence_path && (
            <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold text-foreground">Attached Evidence</h2>
                </div>
                {evidenceUrl && (
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Open Attachment <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              {evidenceUrl && !incident.evidence_path.toLowerCase().endsWith(".pdf") ? (
                <img
                  src={evidenceUrl}
                  alt="Attached incident evidence"
                  className="max-h-64 rounded-xl border object-cover"
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Evidence file attached securely ({incident.evidence_path.split("/").pop()}).
                </p>
              )}
            </div>
          )}

          {/* Location & Map */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Location Details</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    incident.location_sharing
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {incident.location_sharing ? "Location Sharing Active" : "Location Static"}
                </span>
                {incident.accuracy && <span>±{Math.round(incident.accuracy)}m</span>}
              </div>
            </div>

            {incident.location_text && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs">
                <span className="font-semibold text-foreground">Landmark / Area: </span>
                <span className="text-muted-foreground">{incident.location_text}</span>
              </div>
            )}

            {markers.length > 0 ? (
              <div className="rounded-xl overflow-hidden border">
                <MapView markers={markers} height={300} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground bg-muted/20">
                No GPS coordinates were logged for this record.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Responder Info & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Responder Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Assigned Responder</h2>
            </div>
            {incident.responder ? (
              <div className="rounded-xl bg-muted/50 p-4 space-y-2 border">
                <p className="font-semibold text-foreground text-sm">
                  {incident.responder.full_name || "Official Unit"}
                </p>
                <p className="text-xs text-muted-foreground">{incident.responder.email}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Assigned Safety Unit
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground bg-muted/20">
                Awaiting responder assignment from dispatch center…
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Incident Timeline</h2>
            </div>
            <Timeline incidentId={incident.id} />
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Incident Request?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to cancel this request? Responders will be notified that the
              incident has been withdrawn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Yes, Cancel Incident"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
