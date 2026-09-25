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
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIncidents, useAlerts, useProfile, useResources } from "@/lib/queries";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/tourist/")({
  head: () => ({
    meta: [{ title: "Tourist Dashboard — Travel Sathi" }],
  }),
  component: TouristDashboard,
});

function TouristDashboard() {
  const { user } = Route.useRouteContext();
  const { data: profile } = useProfile(user.id);
  const { data: incidents } = useIncidents({ reporterId: user.id });
  const { data: alerts } = useAlerts();
  const { data: resources } = useResources();

  const activeIncidents = (incidents ?? []).filter(
    (i) => i.status !== "resolved" && i.status !== "cancelled",
  );
  const activeSos = activeIncidents.find((i) => i.kind === "sos");

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Traveler";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
            Hello, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your travel safety companion is active. Help is always one tap away.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Safety Shield Active
          </span>
        </div>
      </div>

      {/* Emergency Active SOS Banner if active */}
      {activeSos && (
        <div className="rounded-xl border-2 border-destructive bg-destructive/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="rounded-full bg-destructive p-2.5 text-destructive-foreground">
              <Siren className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-destructive text-sm uppercase tracking-wide">
                  Active Emergency SOS
                </span>
                <span className="text-xs text-muted-foreground font-mono">({activeSos.ref})</span>
              </div>
              <p className="text-sm font-medium text-foreground">
                Current Status: <StatusBadge status={activeSos.status} kind="sos" />
              </p>
            </div>
          </div>
          <Link to="/tourist/emergency">
            <Button variant="destructive" className="font-semibold shadow-md w-full sm:w-auto">
              View Live Emergency Response <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Prominent SOS Trigger Card */}
      {!activeSos && (
        <div className="rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-background p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-destructive">
                Emergency Trigger
              </div>
              <h2 className="text-2xl font-bold font-display text-foreground">
                In Immediate Danger? Trigger SOS
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Transmits your current device GPS coordinates, notifies designated emergency
                contacts, and instantly alerts certified regional responders.
              </p>
            </div>
            <Link to="/tourist/sos" className="w-full sm:w-auto shrink-0">
              <Button
                variant="destructive"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-lg hover:scale-105 transition-transform"
              >
                <Siren className="mr-2 h-6 w-6" />
                OPEN EMERGENCY SOS
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/tourist/report">
          <div className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between h-full">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary w-fit mb-3 group-hover:scale-110 transition-transform">
              <FileWarning className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Report Incident</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Theft, hazard, lost items</p>
            </div>
          </div>
        </Link>

        <Link to="/tourist/assist">
          <div className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between h-full">
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 w-fit mb-3 group-hover:scale-110 transition-transform">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Get Assistance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Medical, police, embassy</p>
            </div>
          </div>
        </Link>

        <Link to="/tourist/contacts">
          <div className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between h-full">
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Emergency Contacts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Trusted family & friends</p>
            </div>
          </div>
        </Link>

        <Link to="/tourist/map">
          <div className="group rounded-xl border bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between h-full">
            <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-600 w-fit mb-3 group-hover:scale-110 transition-transform">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Safety Map</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hospitals, police, hazards</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Two Columns: Active Incidents & Safety Advisories */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: My Incidents (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">My Incidents & Requests</h2>
            </div>
            <Link
              to="/tourist/incidents"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {!incidents?.length ? (
            <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center space-y-2">
              <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No incidents reported</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have no active emergency requests or submitted incidents. Everything looks
                peaceful.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.slice(0, 3).map((inc) => (
                <Link
                  key={inc.id}
                  to="/tourist/incidents/$incidentId"
                  params={{ incidentId: inc.id }}
                  className="block"
                >
                  <div className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-xs transition-all space-y-2">
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
            </div>
          )}
        </div>

        {/* Right Column: Active Alerts & Resources (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Safety Alerts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h2 className="text-base font-semibold text-foreground">Active Safety Alerts</h2>
              </div>
              <Link
                to="/tourist/alerts"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>

            {!alerts?.length ? (
              <div className="rounded-xl border bg-card p-4 text-center text-xs text-muted-foreground">
                No active safety warnings in your area currently.
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border-l-4 border-l-warning border bg-card p-3 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{a.title}</span>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      {a.area ? `${a.area} · ` : ""}Active since{" "}
                      {format(new Date(a.starts_at), "MMM d")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Resources Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Verified Local Services</h2>
              </div>
              <Link
                to="/tourist/resources"
                className="text-xs font-medium text-primary hover:underline"
              >
                Directory
              </Link>
            </div>

            <div className="space-y-2">
              {(resources ?? []).slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-foreground block">{r.name}</span>
                    <span className="text-muted-foreground block line-clamp-1">{r.address}</span>
                  </div>
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 font-semibold text-primary hover:bg-primary/20 transition-colors"
                    >
                      Call
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
