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
  const { data: profile } = useProfile(user.id);
  const { data: incidents } = useIncidents({ reporterId: user.id });
  const { data: alerts } = useAlerts(false);
  const { data: announcements } = useSafetyInfo();
  const { data: contacts } = useEmergencyContacts(user.id);
  const { data: resources } = useResources();

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  async function detectLocation() {
    setLocLoading(true);
    setLocError(null);
    const res = await getLocation(8000);
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
    void detectLocation();
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* 1. Welcome Message & 2. 📍 Current Location */}
      <div className="rounded-2xl border tactical-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/35 glow-emerald">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <ShieldCheck className="h-3.5 w-3.5" />
            VERIFIED SAFE PASS · SHIELD ACTIVE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-foreground">
            Welcome to Travel Sathi, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personal tactical travel safety companion — 1-tap SOS dispatch, live alerts, and
            verified emergency resources.
          </p>
        </div>

        {/* 📍 Current Location Card */}
        <div className="rounded-xl border border-primary/30 bg-background/70 backdrop-blur-md p-3.5 sm:min-w-80 flex items-center justify-between gap-3 glow-cyan">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="rounded-lg bg-primary/15 border border-primary/30 p-2 text-primary shrink-0 mt-0.5">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                📍 Current Location · GNSS
              </p>
              {coords ? (
                <>
                  <p className="text-xs font-mono font-bold text-foreground truncate mt-0.5">
                    {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° E
                  </p>
                  <p className="font-mono text-[10px] font-semibold text-emerald-500">
                    ● SATELLITE LOCK (±{Math.round(coords.accuracy)}m)
                  </p>
                </>
              ) : locLoading ? (
                <p className="text-xs font-mono text-muted-foreground">Acquiring GNSS lock…</p>
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {locError ?? "Tap refresh to lock GPS"}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detectLocation}
            disabled={locLoading}
            className="shrink-0 h-8 px-2.5 text-xs font-mono"
          >
            <LocateFixed className="h-3.5 w-3.5 mr-1 text-primary" />
            {locLoading ? "…" : "Sync"}
          </Button>
        </div>
      </div>

      {/* 3. 🚨 SOS Button — Very Prominent */}
      {activeSos ? (
        <div className="rounded-2xl border-2 border-destructive bg-destructive/15 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glow-crimson">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-destructive p-3.5 text-destructive-foreground shadow-lg">
              <Siren className="h-7 w-7 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-destructive text-xs uppercase tracking-widest">
                  🚨 ACTIVE DISTRESS BEACON
                </span>
                <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive font-mono font-bold">
                  {activeSos.ref}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
                Live Dispatch Status: <StatusBadge status={activeSos.status} kind="sos" />
              </p>
            </div>
          </div>
          <Link to="/tourist/emergency">
            <Button
              variant="destructive"
              size="lg"
              className="font-bold shadow-lg w-full sm:w-auto"
            >
              Open Live Emergency Tracker <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-destructive/50 bg-gradient-to-br from-destructive/20 via-card to-card p-6 sm:p-8 glow-crimson">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-destructive px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-destructive-foreground shadow-xs">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                🚨 ONE-TAP DISTRESS BEACON
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">
                In Immediate Danger? Trigger Emergency SOS
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Transmits your live GPS coordinates, alerts your primary emergency contacts, and
                dispatches the nearest verified ambulance &amp; police responder unit immediately.
              </p>
            </div>
            <Link to="/tourist/sos" className="w-full md:w-auto shrink-0">
              <Button
                variant="destructive"
                size="lg"
                className="w-full md:w-auto h-16 px-10 text-lg font-extrabold tracking-wider shadow-xl glow-crimson hover:scale-105 transition-transform"
              >
                <Siren className="mr-2.5 h-7 w-7 animate-pulse" />
                TRIGGER SOS NOW
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 4. ⚠️ Active Safety Alerts & 5. 📢 Recent Announcements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ⚠️ Active Safety Alerts */}
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h2 className="text-base font-semibold text-foreground">⚠️ Active Safety Alerts</h2>
              <Badge variant="secondary" className="text-[11px]">
                {alerts?.length ?? 0}
              </Badge>
            </div>
            <Link to="/tourist/alerts" className="text-xs font-medium text-primary hover:underline">
              View all alerts →
            </Link>
          </div>

          {!alerts?.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No active safety warnings in your area right now.
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border-l-4 border-l-warning border bg-muted/20 p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-foreground">{a.title}</span>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                  <p className="text-[11px] text-muted-foreground/80">
                    {a.area ? `📍 ${a.area} · ` : ""}Active since{" "}
                    {format(new Date(a.starts_at), "MMM d, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📢 Recent Announcements */}
        <div className="rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">📢 Recent Announcements</h2>
            </div>
            <Link to="/tourist/safety" className="text-xs font-medium text-primary hover:underline">
              All safety advisories →
            </Link>
          </div>

          {!announcements?.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No recent announcements published yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {announcements.slice(0, 3).map((info) => (
                <Link
                  key={info.id}
                  to="/tourist/safety"
                  className="block rounded-lg border bg-muted/20 p-3.5 hover:border-primary/40 transition-colors space-y-1"
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

      {/* 6. 🗺️ Quick Access to Map & 7. 🆘 Emergency Contacts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 🗺️ Quick Access to Map (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 flex flex-col justify-between gap-4 shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                <MapIcon className="h-3.5 w-3.5" />
                🗺️ Live Safety Map
              </span>
              <span className="text-xs text-muted-foreground">
                {(resources ?? []).length} verified points
              </span>
            </div>
            <h3 className="text-lg font-bold font-display text-foreground">
              Quick Access to Interactive Map
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              View nearby police stations, 24/7 hospitals, fire stations, tourist help desks, and
              your active incident pins on an interactive live map.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border bg-background/80 p-2.5">
              <span className="text-muted-foreground block">Verified Resources</span>
              <span className="text-base font-bold text-foreground">
                {(resources ?? []).length}
              </span>
            </div>
            <div className="rounded-lg border bg-background/80 p-2.5">
              <span className="text-muted-foreground block">Active Warnings</span>
              <span className="text-base font-bold text-foreground">{(alerts ?? []).length}</span>
            </div>
          </div>

          <Button asChild className="w-full font-semibold">
            <Link to="/tourist/map">
              <MapPin className="mr-1.5 h-4 w-4" />
              Open Live Safety Map
            </Link>
          </Button>
        </div>

        {/* 🆘 Emergency Contacts (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <h2 className="text-base font-semibold text-foreground">🆘 Emergency Contacts</h2>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <Link to="/tourist/contacts">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Manage Contacts
              </Link>
            </Button>
          </div>

          {!contacts?.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
              <p className="text-sm font-medium text-foreground">No emergency contacts saved yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Add a trusted family member or friend so emergency responders know who to notify in
                case of an SOS.
              </p>
              <Button asChild size="sm" variant="secondary">
                <Link to="/tourist/contacts">Add Primary Contact</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {contacts.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border bg-muted/20 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {c.name}
                      </span>
                      {c.is_primary && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.relationship || "Trusted Contact"} · {c.phone}
                    </p>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
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

      {/* 8. 📋 Your Active/Recent Reports & File a Report + 9. 🏥 Nearby Emergency Resources */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* 📋 Your Active/Recent & File a Report (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                📋 Your Active / Recent Reports
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

          {!incidents?.length ? (
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

        {/* 🏥 Nearby Emergency Resources (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                🏥 Nearby Emergency Resources
              </h2>
            </div>
            <Link
              to="/tourist/resources"
              className="text-xs font-medium text-primary hover:underline"
            >
              Full directory →
            </Link>
          </div>

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
                      {r.operating_hours && <span>🕒 {r.operating_hours}</span>}
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
        </div>
      </div>
    </div>
  );
}
