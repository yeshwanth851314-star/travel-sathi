import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  MessageSquarePlus,
  Navigation,
  Phone,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useEmergencyContacts,
  useIncident,
  useIncidentLocations,
  useIncidentNotes,
  useTouristProfile,
} from "@/lib/queries";
import { useEvidenceUrl } from "@/lib/evidence";
import {
  errMsg,
  isActive,
  KIND_LABEL,
  NEXT_STATUSES,
  statusLabel,
  type Status,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { MapView } from "@/components/app/MapView";
import { Timeline } from "@/components/app/Timeline";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/incidents/$incidentId")({
  component: ResponderIncidentDetail,
});

function ResponderIncidentDetail() {
  const { incidentId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: incident, isLoading, error } = useIncident(incidentId);
  const { data: notes } = useIncidentNotes(incidentId);
  const { data: locations } = useIncidentLocations(incidentId);
  const { data: touristProfile } = useTouristProfile(incident?.reporter_id);
  const { data: emergencyContacts } = useEmergencyContacts(incident?.reporter_id);
  const { data: evidenceUrl } = useEvidenceUrl(incident?.evidence_path);

  const [statusNote, setStatusNote] = useState("");
  const [newNote, setNewNote] = useState("");
  const [busyStatus, setBusyStatus] = useState(false);
  const [busyNote, setBusyNote] = useState(false);

  const refreshAll = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["incident", incidentId] }),
      qc.invalidateQueries({ queryKey: ["incidents"] }),
      qc.invalidateQueries({ queryKey: ["timeline", incidentId] }),
      qc.invalidateQueries({ queryKey: ["incident_notes", incidentId] }),
    ]);

  const handleStatusTransition = async (nextStatus: Status) => {
    if (nextStatus === "resolved" && !statusNote.trim()) {
      toast.error("Please enter a resolution summary note before marking as Resolved.");
      return;
    }
    setBusyStatus(true);
    try {
      const { error: rpcErr } = await supabase.rpc("update_incident_status", {
        _incident_id: incidentId,
        _status: nextStatus,
        ...(statusNote.trim() ? { _note: statusNote.trim() } : {}),
      });
      if (rpcErr) throw rpcErr;
      setStatusNote("");
      await refreshAll();
      toast.success(`Status updated to ${statusLabel(nextStatus)}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyStatus(false);
    }
  };

  const handleSelfAssign = async () => {
    setBusyStatus(true);
    try {
      const { error: rpcErr } = await supabase.rpc("assign_incident", {
        _incident_id: incidentId,
        _responder_id: user.id,
      });
      if (rpcErr) throw rpcErr;
      await refreshAll();
      toast.success("Incident assigned to you.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setBusyNote(true);
    try {
      const { error: nErr } = await supabase.from("incident_notes").insert({
        incident_id: incidentId,
        author_id: user.id,
        note: newNote.trim(),
      });
      if (nErr) throw nErr;
      setNewNote("");
      await qc.invalidateQueries({ queryKey: ["incident_notes", incidentId] });
      toast.success("Operational note added.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusyNote(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!incident) return <Empty title="Incident not found" />;

  const nextStatuses = NEXT_STATUSES[incident.status] ?? [];
  const hasCoords = incident.latitude !== null && incident.longitude !== null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`
    : incident.location_text
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(incident.location_text)}`
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/responder/incidents"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Queue
        </Link>
      </div>

      <PageHeader
        title={`${incident.ref} · ${incident.category}`}
        desc={`${KIND_LABEL[incident.kind]} reported on ${format(new Date(incident.created_at), "PPpp")}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} kind={incident.kind} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Responder Status & Dispatch Controls */}
          {isActive(incident.status) && (
            <div className="rounded-xl border-2 border-primary/30 bg-card p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" /> Responder Action Panel
                </h2>
                {incident.assigned_responder_id !== user.id && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyStatus}
                    onClick={handleSelfAssign}
                  >
                    <UserCheck className="h-4 w-4 mr-1.5" /> Assign to Me
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status-note">
                  Status Update / Resolution Note (required when resolving)
                </Label>
                <Textarea
                  id="status-note"
                  rows={2}
                  placeholder="Enter dispatch update, field observation, or resolution summary…"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((st) => (
                  <Button
                    key={st}
                    type="button"
                    disabled={busyStatus}
                    variant={
                      st === "resolved"
                        ? "default"
                        : st === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                    onClick={() => handleStatusTransition(st)}
                  >
                    {st === "resolved" && <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                    Mark as {statusLabel(st)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Incident Overview */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Incident Details</h2>
            <p className="text-sm whitespace-pre-line">
              {incident.description || "No additional written description provided."}
            </p>

            {incident.resolution && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
                <p className="font-semibold text-success">Resolution Summary</p>
                <p className="mt-1">{incident.resolution}</p>
              </div>
            )}

            <dl className="grid gap-3 sm:grid-cols-2 text-sm border-t pt-4">
              <div>
                <dt className="text-xs text-muted-foreground">Assigned Responder</dt>
                <dd className="font-medium">
                  {incident.assigned_responder_id === user.id
                    ? "Assigned to You"
                    : incident.responder?.full_name || "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Callback / Contact Info</dt>
                <dd className="font-medium">
                  {incident.contact_info || incident.reporter?.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Location Description</dt>
                <dd className="font-medium">{incident.location_text || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Coordinates</dt>
                <dd className="font-mono text-xs">
                  {hasCoords
                    ? `${incident.latitude!.toFixed(5)}, ${incident.longitude!.toFixed(5)} (±${Math.round(incident.accuracy ?? 0)}m)`
                    : "Not shared"}
                </dd>
              </div>
            </dl>

            {evidenceUrl && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Attached Evidence
                </p>
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                >
                  Open Attached Evidence <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Map & Location History */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-base">Location & Navigation</h2>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <Navigation className="h-3.5 w-3.5" /> Navigate in Google Maps
                </a>
              )}
            </div>

            {hasCoords ? (
              <MapView
                markers={[
                  {
                    id: incident.id,
                    lat: incident.latitude!,
                    lng: incident.longitude!,
                    label: `${incident.ref} · ${incident.category}`,
                    kind: "incident",
                    critical: incident.severity === "critical" || incident.kind === "sos",
                  },
                ]}
                height={300}
              />
            ) : (
              <Empty
                title="No GPS coordinates available"
                hint={
                  incident.location_text
                    ? `Landmark provided: ${incident.location_text}`
                    : "The tourist submitted this report without GPS coordinates."
                }
              />
            )}

            {(locations ?? []).length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                  GPS Breadcrumb History ({locations?.length})
                </h3>
                <div className="max-h-40 overflow-y-auto divide-y text-xs">
                  {(locations ?? []).map((loc) => (
                    <div key={loc.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono">
                        {loc.latitude !== null && loc.longitude !== null
                          ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                          : loc.location_text || "Location update"}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(loc.created_at), "HH:mm:ss")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Responder Internal Notes */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Responder Operational Notes</h2>
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Add internal responder note (visible to responders and admins)…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={busyNote || !newNote.trim()}>
                  <MessageSquarePlus className="h-4 w-4 mr-1.5" />
                  {busyNote ? "Saving…" : "Add Note"}
                </Button>
              </div>
            </form>

            {!(notes ?? []).length ? (
              <p className="text-xs text-muted-foreground">No internal notes recorded yet.</p>
            ) : (
              <ul className="space-y-2.5 pt-2 border-t">
                {(notes ?? []).map((n) => (
                  <li key={n.id} className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {n.author?.full_name || n.author?.email || "Staff"}
                      </span>
                      <span>{format(new Date(n.created_at), "PP p")}</span>
                    </div>
                    <p className="whitespace-pre-line">{n.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Tourist Profile, Emergency Contacts & Timeline */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Tourist Emergency Dossier</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                <strong>{incident.reporter?.full_name || "—"}</strong>
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span>{incident.reporter?.email || "—"}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span>{" "}
                {incident.reporter?.phone ? (
                  <a
                    href={`tel:${incident.reporter.phone}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {incident.reporter.phone}
                  </a>
                ) : (
                  "—"
                )}
              </p>
              {touristProfile && (
                <>
                  <p>
                    <span className="text-muted-foreground">Nationality:</span>{" "}
                    <span>{touristProfile.nationality || "—"}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Languages:</span>{" "}
                    <span>{touristProfile.languages || "—"}</span>
                  </p>
                  {touristProfile.medical_notes && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs">
                      <p className="font-bold text-destructive uppercase">Medical Notes</p>
                      <p className="mt-0.5 text-foreground">{touristProfile.medical_notes}</p>
                    </div>
                  )}
                  {touristProfile.travel_notes && (
                    <div className="rounded-lg border bg-muted/40 p-2.5 text-xs">
                      <p className="font-semibold text-muted-foreground uppercase">Travel Notes</p>
                      <p className="mt-0.5 text-foreground">{touristProfile.travel_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Emergency Contacts ({(emergencyContacts ?? []).length})
              </h3>
              {!(emergencyContacts ?? []).length ? (
                <p className="text-xs text-muted-foreground">
                  Tourist has not registered any emergency contacts.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(emergencyContacts ?? []).map((ec) => (
                    <li
                      key={ec.id}
                      className="rounded-lg border p-2.5 text-xs flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold">
                          {ec.name} {ec.is_primary ? "★" : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {ec.relationship || "Contact"} · {ec.phone}
                        </p>
                      </div>
                      {ec.phone && (
                        <a
                          href={`tel:${ec.phone}`}
                          className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 font-semibold text-primary-foreground"
                        >
                          <Phone className="h-3 w-3" /> Call
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Incident Timeline</h2>
            <Timeline incidentId={incidentId} />
          </div>
        </div>
      </div>
    </div>
  );
}
