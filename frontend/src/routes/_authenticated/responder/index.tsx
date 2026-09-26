import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, isToday } from "date-fns";
import {
  Siren,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { useIncidents } from "@/lib/queries";
import { isActive, KIND_LABEL, SEVERITY_RANK } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/")({
  component: ResponderDashboard,
});

function ResponderDashboard() {
  const { user } = Route.useRouteContext();
  const { data: incidents, isLoading, error } = useIncidents();

  const stats = useMemo(() => {
    const all = incidents ?? [];
    const active = all.filter((i) => isActive(i.status));
    const critical = active.filter((i) => i.severity === "critical" || i.kind === "sos");
    const assignedToMe = active.filter((i) => i.assigned_responder_id === user.id);
    const unassigned = active.filter((i) => !i.assigned_responder_id);
    const resolvedToday = all.filter(
      (i) => i.status === "resolved" && i.resolved_at && isToday(new Date(i.resolved_at)),
    );
    return {
      activeCount: active.length,
      criticalCount: critical.length,
      assignedToMeCount: assignedToMe.length,
      unassignedCount: unassigned.length,
      resolvedTodayCount: resolvedToday.length,
      priorityQueue: [...active]
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 8),
    };
  }, [incidents, user.id]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Responder Command Center"
        desc="Real-time emergency triage, SOS response dispatch, and tourist assistance queue."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/responder/map">
              <MapPin className="h-4 w-4 mr-1.5" /> Operational Map
            </Link>
          </Button>
          <Button asChild>
            <Link to="/responder/incidents">
              <Siren className="h-4 w-4 mr-1.5" /> All Active Incidents
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Active Queue</span>
            <Siren className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display">{stats.activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.unassignedCount} awaiting assignment
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-destructive">
            <span>Critical / SOS</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display text-destructive">
            {stats.criticalCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Immediate response priority</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Assigned to Me</span>
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display">{stats.assignedToMeCount}</p>
          <Link
            to="/responder/assigned"
            className="text-xs font-medium text-primary hover:underline mt-1 inline-block"
          >
            View my cases →
          </Link>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Resolved Today</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="mt-2 text-2xl font-bold font-display">{stats.resolvedTodayCount}</p>
          <Link
            to="/responder/history"
            className="text-xs text-muted-foreground hover:underline mt-1 inline-block"
          >
            View history →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-base text-foreground">Priority Triage Queue</h2>
            <p className="text-xs text-muted-foreground">Ordered by severity and time of report</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/responder/incidents">
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {!stats.priorityQueue.length ? (
          <Empty
            title="No active incidents in the queue"
            hint="All reported emergencies and assistance requests have been resolved."
          />
        ) : (
          <div className="divide-y rounded-xl border">
            {stats.priorityQueue.map((inc) => (
              <Link
                key={inc.id}
                to="/responder/incidents/$incidentId"
                params={{ incidentId: inc.id }}
                className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {inc.ref}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">
                      {KIND_LABEL[inc.kind]}
                    </span>
                    <span className="font-semibold text-sm text-foreground">{inc.category}</span>
                  </div>
                  {inc.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{inc.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Reporter:{" "}
                      <strong className="text-foreground font-medium">
                        {inc.reporter?.full_name || inc.reporter?.email || "Tourist"}
                      </strong>
                    </span>
                    <span>· {format(new Date(inc.created_at), "MMM d, HH:mm")}</span>
                    {inc.location_text && <span>· {inc.location_text}</span>}
                    {inc.assigned_responder_id === user.id && (
                      <span className="text-primary font-medium">· Assigned to you</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inc.status} kind={inc.kind} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
