import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Siren,
  FileWarning,
  LifeBuoy,
  Users,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building2,
  Megaphone,
  Map as MapIcon,
  Phone,
  LocateFixed,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useIncidents,
  useAlerts,
  useProfile,
  useResources,
  useEmergencyContacts,
  useSafetyInfo,
} from "@/lib/queries";
import { getLocation } from "@/lib/geo";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tourist/")({
  head: () => ({
    meta: [{ title: "Tourist Dashboard — Travel Sathi" }],
  }),
  component: TouristDashboard,
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function TouristDashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile, isLoading: profileLoading } = useProfile(user.id);
  const { data: incidents, isLoading: incidentsLoading } = useIncidents({ reporterId: user.id });
  const { data: alerts, isLoading: alertsLoading } = useAlerts(false);
  const { data: announcements, isLoading: announcementsLoading } = useSafetyInfo();
  const { data: contacts, isLoading: contactsLoading } = useEmergencyContacts(user.id);
  const { data: resources, isLoading: resourcesLoading } = useResources();

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  async function detectLocation(force = false) {
    setLocLoading(true);
    setLocError(null);
    const res = await getLocation(5000, force);
    setLocLoading(false);
    if (res.ok) {
      setCoords({
        latitude: res.latitude,
        longitude: res.longitude,
        accuracy: res.accuracy,
      });
    } else {
      setLocError(res.reason);
    }
  }

  useEffect(() => {
    void detectLocation(false);
  }, []);

  const activeIncidents = (incidents ?? []).filter(
    (i) => i.status !== "resolved" && i.status !== "cancelled",
  );
  const activeSos = activeIncidents.find((i) => i.kind === "sos");

  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Pratibha";

  const sortedResources = [...(resources ?? [])].sort((a, b) => {
    if (!coords) return 0;
    const da =
      a.latitude != null && a.longitude != null
        ? haversineKm(coords.latitude, coords.longitude, a.latitude, a.longitude)
        : 9999;
    const db =
      b.latitude != null && b.longitude != null
        ? haversineKm(coords.latitude, coords.longitude, b.latitude, b.longitude)
        : 9999;
    return da - db;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* 1. Welcome Message & 2. Current Location */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-2 flex-wrap">
            <span>Welcome to Travel Sathi,</span>
            {profileLoading && !profile ? (
              <Skeleton className="h-8 w-32 inline-block" />
            ) : (
              <span>{displayName}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal travel safety hub — emergency assistance, local alerts, and verified
            resources.
          </p>
        </div>

        {/* Current Location Pill */}
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-2xs">
          <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Current Location</p>
            {coords ? (
              <p className="text-xs font-mono font-semibold text-foreground">
                {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° E{" "}
                <span className="font-sans font-normal text-muted-foreground">
                  (±{Math.round(coords.accuracy)}m)
                </span>
              </p>
            ) : locLoading ? (
              <Skeleton className="h-4 w-40 mt-1" />
            ) : (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {locError ?? "Location unavailable"}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => detectLocation(true)}
            disabled={locLoading}
            className="shrink-0 h-8 px-2.5 text-xs"
          >
            <LocateFixed className="h-3.5 w-3.5 mr-1" />
            {locLoading ? "…" : "Update"}
          </Button>
        </div>
      </div>

      {/* 3. Prominent SOS Banner */}
      {activeSos ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-destructive p-3 text-destructive-foreground">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-destructive text-sm">Active Emergency SOS</span>
                <span className="text-xs text-muted-foreground font-mono">({activeSos.ref})</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                Status: <StatusBadge status={activeSos.status} kind="sos" />
              </p>
            </div>
          </div>
          <Link to="/tourist/emergency">
            <Button variant="destructive" className="font-semibold w-full sm:w-auto">
              View Live Response <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Siren className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-display text-foreground">
                Emergency SOS Assistance
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                In immediate danger? Trigger an SOS to share your live GPS coordinates and dispatch
                the nearest emergency responder.
              </p>
            </div>
          </div>
          <Link to="/tourist/sos" className="w-full md:w-auto shrink-0">
            <Button
              variant="destructive"
              size="lg"
              className="w-full md:w-auto h-12 px-8 text-sm font-semibold shadow-xs"
            >
              <Siren className="mr-2 h-4 w-4" />
              Trigger Emergency SOS
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Active Safety Alerts & 5. Recent Announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Safety Alerts */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-base font-semibold text-foreground">Active Safety Alerts</h2>
              {!!alerts?.length && (
                <Badge variant="secondary" className="text-xs">
                  {alerts.length}
                </Badge>
              )}
            </div>
            <Link to="/tourist/alerts" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          {alertsLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : !alerts?.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
              No active safety alerts in your area.
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {alerts.slice(0, 3).map((a) => (
                <div key={a.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{a.title}</span>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                  <p className="text-[11px] text-muted-foreground/80 pt-0.5">
                    {a.area ? `${a.area} · ` : ""}
                    {format(new Date(a.starts_at), "MMM d, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Megaphone className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Recent Announcements</h2>
            </div>
            <Link to="/tourist/safety" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>

          {announcementsLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-4/5" />
                </div>
              ))}
            </div>
          ) : !announcements?.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground">
              No recent announcements published yet.
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {announcements.slice(0, 3).map((info) => (
                <Link
                  key={info.id}
                  to="/tourist/safety"
                  className="block p-4 hover:bg-muted/40 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground line-clamp-1">
                      {info.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {info.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{info.content}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Quick Access to Map & 7. Emergency Contacts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Quick Access to Map (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border bg-card p-6 flex flex-col justify-between gap-5 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <MapIcon className="h-4 w-4" />
              <h2 className="text-base font-semibold text-foreground">Interactive Safety Map</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Locate verified police stations, hospitals, embassies, and active safety advisories
              around your current position.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border bg-muted/30 p-3">
              <span className="text-muted-foreground block">Verified Locations</span>
              {resourcesLoading ? (
                <Skeleton className="h-6 w-10 mt-1" />
              ) : (
                <span className="text-lg font-bold text-foreground mt-0.5 block">
                  {(resources ?? []).length}
                </span>
              )}
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <span className="text-muted-foreground block">Active Alerts</span>
              {alertsLoading ? (
                <Skeleton className="h-6 w-10 mt-1" />
              ) : (
                <span className="text-lg font-bold text-foreground mt-0.5 block">
                  {(alerts ?? []).length}
                </span>
              )}
            </div>
          </div>

          <Button asChild variant="outline" className="w-full font-medium">
            <Link to="/tourist/map">
              <MapPin className="mr-1.5 h-4 w-4" />
              Open Live Safety Map
            </Link>
          </Button>
        </div>

        {/* Emergency Contacts (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Emergency Contacts</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link to="/tourist/contacts">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Manage Contacts
              </Link>
            </Button>
          </div>

          {contactsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3.5 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-7 w-14 rounded-lg" />
                </div>
              ))}
            </div>
          ) : !contacts?.length ? (
            <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">No emergency contacts saved</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Add a trusted contact so responders know who to reach during an emergency.
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link to="/tourist/contacts">Add Primary Contact</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {c.name}
                      </span>
                      {c.is_primary && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.relationship || "Contact"} · {c.phone}
                    </p>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8. Your Active/Recent Reports & 9. Nearby Emergency Resources */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Your Active/Recent & File a Report (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Active &amp; Recent Reports
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" className="h-8 text-xs">
                <Link to="/tourist/report">
                  <FileWarning className="mr-1.5 h-3.5 w-3.5" />
                  File a Report
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                <Link to="/tourist/assist">
                  <LifeBuoy className="mr-1.5 h-3.5 w-3.5" />
                  Request Assistance
                </Link>
              </Button>
            </div>
          </div>

          {incidentsLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-14" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ))}
            </div>
          ) : !incidents?.length ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center space-y-2">
              <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No active or recent reports</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Need to report a lost passport, theft, safety hazard, or request medical/embassy
                help? Use the buttons above to file a report anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {incidents.slice(0, 4).map((inc) => (
                <Link
                  key={inc.id}
                  to="/tourist/incidents/$incidentId"
                  params={{ incidentId: inc.id }}
                  className="block"
                >
                  <div className="rounded-xl border bg-muted/15 p-3.5 hover:border-primary/40 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {inc.ref}
                        </span>
                        <SeverityBadge severity={inc.severity} />
                        <span className="text-xs text-muted-foreground uppercase font-medium">
                          {inc.kind}
                        </span>
                      </div>
                      <StatusBadge status={inc.status} kind={inc.kind} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{inc.category}</p>
                    {inc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {inc.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t">
                      <span>{format(new Date(inc.created_at), "PP p")}</span>
                      {inc.responder?.full_name ? (
                        <span className="text-primary font-medium">
                          Responder: {inc.responder.full_name}
                        </span>
                      ) : (
                        <span>Awaiting responder assignment</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="pt-1 text-right">
                <Link
                  to="/tourist/incidents"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all reports ({incidents.length}) →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Nearby Emergency Resources (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Nearby Emergency Resources
              </h2>
            </div>
            <Link
              to="/tourist/resources"
              className="text-xs font-medium text-primary hover:underline"
            >
              Full directory
            </Link>
          </div>

          {resourcesLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border p-3.5 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-7 w-14 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedResources.slice(0, 4).map((r) => {
                const distKm =
                  coords && r.latitude != null && r.longitude != null
                    ? haversineKm(coords.latitude, coords.longitude, r.latitude, r.longitude)
                    : null;
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border bg-muted/20 p-3.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{r.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          {r.type}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground block line-clamp-1">{r.address}</span>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
                        {r.operating_hours && <span>{r.operating_hours}</span>}
                        {distKm !== null && (
                          <span className="font-medium text-primary">
                            · {distKm.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>
                    {r.phone && (
                      <a
                        href={`tel:${r.phone}`}
                        className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
