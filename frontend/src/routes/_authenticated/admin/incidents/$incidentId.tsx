import { useMemo, useState } from "react";
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
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllUsers,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { MapView } from "@/components/app/MapView";
import { Timeline } from "@/components/app/Timeline";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/incidents/$incidentId")({
  component: AdminIncidentDetail,
});

function AdminIncidentDetail() {
  const { incidentId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { data: incident, isLoading, error } = useIncident(incidentId);
  const { data: allUsers } = useAllUsers();
  const { data: notes } = useIncidentNotes(incidentId);
  const { data: locations } = useIncidentLocations(incidentId);
  const { data: touristProfile } = useTouristProfile(incident?.reporter_id);
  const { data: emergencyContacts } = useEmergencyContacts(incident?.reporter_id);
  const { data: evidenceUrl } = useEvidenceUrl(incident?.evidence_path);

  const responders = useMemo(
    () => (allUsers ?? []).filter((u) => u.role === "responder" || u.role === "admin"),
    [allUsers],
  );

  const [selectedResponder, setSelectedResponder] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [newNote, setNewNote] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshAll = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["incident", incidentId] }),
      qc.invalidateQueries({ queryKey: ["incidents"] }),
      qc.invalidateQueries({ queryKey: ["timeline", incidentId] }),
      qc.invalidateQueries({ queryKey: ["incident_notes", incidentId] }),
      qc.invalidateQueries({ queryKey: ["audit_logs"] }),
    ]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedResponder || incident?.assigned_responder_id;
    if (!targetId) {
      toast.error("Please select a responder to assign.");
      return;
    }
    setBusy(true);
    try {
      const { error: rpcErr } = await supabase.rpc("assign_incident", {
        _incident_id: incidentId,
        _responder_id: targetId,
      });
      if (rpcErr) throw rpcErr;
      await refreshAll();
      toast.success("Responder assigned and notified.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleStatusTransition = async (nextStatus: Status) => {
    if (nextStatus === "resolved" && !statusNote.trim()) {
      toast.error("Please enter a resolution note before marking as Resolved.");
      return;
    }
    setBusy(true);
    try {
      const { error: rpcErr } = await supabase.rpc("update_incident_status", {
        _incident_id: incidentId,
        _status: nextStatus,
        ...(statusNote.trim() ? { _note: statusNote.trim() } : {}),
      });
      if (rpcErr) throw rpcErr;
      setStatusNote("");
      await refreshAll();
      toast.success(`Incident marked as ${statusLabel(nextStatus)}.`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setBusy(true);
    try {
      const { error: nErr } = await supabase.from("incident_notes").insert({
        incident_id: incidentId,
        author_id: user.id,
        note: newNote.trim(),
      });
      if (nErr) throw nErr;
      setNewNote("");
      await qc.invalidateQueries({ queryKey: ["incident_notes", incidentId] });
      toast.success("Admin note added.");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!incident) return <Empty title="Incident not found" />;

  const nextStatuses = NEXT_STATUSES[incident.status] ?? [];
  const hasCoords = incident.latitude !== null && incident.longitude !== null;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${incident.latitude},${incident.longitude}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/admin/incidents"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Incidents
        </Link>
      </div>

      <PageHeader
        title={`${incident.ref} · ${incident.category}`}
        desc={`${KIND_LABEL[incident.kind]} · Created ${format(new Date(incident.created_at), "PPpp")}`}
      >
        <div className="flex items-center gap-2">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} kind={incident.kind} />
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Dispatch & Assignment Controls */}
          <div className="rounded-xl border-2 border-primary/30 bg-card p-5 space-y-5 shadow-2xs">
            <h2 className="font-semibold text-base">Admin Dispatch & Status Governance</h2>

            <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-3 border-b pb-4">
              <div className="space-y-1.5 flex-1 min-w-[220px]">
                <Label htmlFor="assign-select">Assign Responder</Label>
                <select
                  id="assign-select"
                  value={selectedResponder || incident.assigned_responder_id || ""}
                  onChange={(e) => setSelectedResponder(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-2.5 text-sm"
                >
                  <option value="">Select responder…</option>
                  {responders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name || r.email} ({r.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={busy}>
                <UserCheck className="h-4 w-4 mr-1.5" /> Assign Responder
              </Button>
            </form>

            {isActive(incident.status) && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-status-note">Status Update / Resolution Summary Note</Label>
                  <Textarea
                    id="admin-status-note"
                    rows={2}
                    placeholder="Provide context or resolution note…"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((st) => (
                    <Button
                      key={st}
                      type="button"
                      disabled={busy}
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
          </div>

          {/* Incident Overview */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Incident Record</h2>
            <p className="text-sm whitespace-pre-line">
              {incident.description || "No written description provided."}
            </p>

            {incident.resolution && (
              <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm">
                <p className="font-semibold text-success">Resolution Note</p>
                <p className="mt-1">{incident.resolution}</p>
              </div>
            )}

            <dl className="grid gap-3 sm:grid-cols-2 text-sm border-t pt-4">
              <div>
                <dt className="text-xs text-muted-foreground">Assigned Responder</dt>
                <dd className="font-medium">
                  {incident.responder?.full_name || incident.responder?.email || "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Callback Info</dt>
                <dd className="font-medium">
                  {incident.contact_info || incident.reporter?.phone || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Landmark / Location Text</dt>
                <dd className="font-medium">{incident.location_text || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Coordinates</dt>
                <dd className="font-mono text-xs">
                  {hasCoords
                    ? `${incident.latitude!.toFixed(5)}, ${incident.longitude!.toFixed(5)}`
                    : "Not available"}
                </dd>
              </div>
            </dl>

            {evidenceUrl && (
              <div className="border-t pt-4 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Evidence Attachment
                </p>
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
                >
                  View Evidence File <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Map & Breadcrumbs */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Incident Location</h2>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Navigation className="h-3.5 w-3.5" /> Open in Google Maps
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
                height={280}
              />
            ) : (
              <Empty title="No coordinates recorded for this incident" />
            )}
            {(locations ?? []).length > 0 && (
              <div className="pt-2 border-t text-xs space-y-1">
                <p className="font-semibold text-muted-foreground uppercase">
                  Location Updates ({locations?.length})
                </p>
                {(locations ?? []).slice(0, 8).map((l) => (
                  <div key={l.id} className="flex justify-between py-1 border-b last:border-0">
                    <span className="font-mono">
                      {l.latitude !== null && l.longitude !== null
                        ? `${l.latitude.toFixed(5)}, ${l.longitude.toFixed(5)}`
                        : l.location_text || "Update"}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(l.created_at), "PP HH:mm:ss")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Internal Staff Notes</h2>
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Add administrative or dispatch note…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={busy || !newNote.trim()}>
                  <MessageSquarePlus className="h-4 w-4 mr-1.5" /> Add Note
                </Button>
              </div>
            </form>

            {!(notes ?? []).length ? (
              <p className="text-xs text-muted-foreground">No staff notes yet.</p>
            ) : (
              <ul className="space-y-2 pt-2 border-t">
                {(notes ?? []).map((n) => (
                  <li key={n.id} className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
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

        {/* Right Column: Tourist Dossier & Timeline */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Tourist Profile & Contacts</h2>
            <div className="space-y-1.5 text-sm">
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
                <span>{incident.reporter?.phone || "—"}</span>
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
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs mt-2">
                      <p className="font-bold text-destructive uppercase">Medical Notes</p>
                      <p className="mt-0.5">{touristProfile.medical_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Emergency Contacts ({(emergencyContacts ?? []).length})
              </h3>
              {(emergencyContacts ?? []).map((ec) => (
                <div
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
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 font-semibold text-primary-foreground"
                    >
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
            <h2 className="font-semibold text-base">Audit & Status Timeline</h2>
            <Timeline incidentId={incidentId} />
          </div>
        </div>
      </div>
    </div>
  );
}
