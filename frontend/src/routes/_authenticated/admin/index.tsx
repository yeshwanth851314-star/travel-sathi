import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Map,
  ScrollText,
  Shield,
  Siren,
  User,
  Users,
  ArrowRight,
} from "lucide-react";
import {
  useAlerts,
  useAllUsers,
  useAuditLogs,
  useIncidents,
  useResources,
  useSafetyInfo,
} from "@/lib/queries";
import { isActive, KIND_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: users, isLoading: uLoad, error: uErr } = useAllUsers();
  const { data: incidents, isLoading: iLoad, error: iErr } = useIncidents();
  const { data: alerts } = useAlerts(true);
  const { data: resources } = useResources();
  const { data: safetyInfo } = useSafetyInfo();
  const { data: audits } = useAuditLogs();

  const metrics = useMemo(() => {
    const uList = users ?? [];
    const iList = incidents ?? [];
    const activeInc = iList.filter((i) => isActive(i.status));

    return {
      totalUsers: uList.length,
      tourists: uList.filter((u) => u.role === "tourist").length,
      responders: uList.filter((u) => u.role === "responder").length,
      admins: uList.filter((u) => u.role === "admin").length,
      activeIncidents: activeInc.length,
      criticalIncidents: activeInc.filter((i) => i.severity === "critical" || i.kind === "sos")
        .length,
      unassignedActive: activeInc.filter((i) => !i.assigned_responder_id).length,
      resolvedIncidents: iList.filter((i) => i.status === "resolved").length,
      activeAlerts: (alerts ?? []).filter((a) => a.is_active).length,
      verifiedResources: (resources ?? []).filter((r) => r.is_verified).length,
      publishedArticles: (safetyInfo ?? []).filter((s) => s.is_published).length,
      recentActive: activeInc.slice(0, 5),
      recentAudits: (audits ?? []).slice(0, 5),
    };
  }, [users, incidents, alerts, resources, safetyInfo, audits]);

  if (uLoad || iLoad) return <Loading />;
  if (uErr || iErr) return <ErrorState error={uErr ?? iErr} />;

  const kpis = [
    {
      label: "Active Incidents",
      value: metrics.activeIncidents,
      sub: `${metrics.unassignedActive} unassigned`,
      icon: Siren,
      to: "/admin/incidents",
    },
    {
      label: "Critical / SOS Active",
      value: metrics.criticalIncidents,
      sub: "Immediate dispatch priority",
      icon: AlertTriangle,
      to: "/admin/incidents",
      danger: true,
    },
    {
      label: "Users & Staff",
      value: metrics.totalUsers,
      sub: `${metrics.tourists} tourists · ${metrics.responders} responders`,
      icon: Users,
      to: "/admin/users",
    },
    {
      label: "Safety Information",
      value: metrics.publishedArticles,
      sub: "Published advisories",
      icon: Shield,
      to: "/admin/safety",
    },
    {
      label: "Emergency Resources",
      value: (resources ?? []).length,
      sub: `${metrics.verifiedResources} verified facilities`,
      icon: Building2,
      to: "/admin/resources",
    },
    {
      label: "Safety Alerts",
      value: metrics.activeAlerts,
      sub: "Active broadcasts",
      icon: AlertTriangle,
      to: "/admin/alerts",
    },
    {
      label: "Resolved Cases",
      value: metrics.resolvedIncidents,
      sub: "View trends in Analytics",
      icon: CheckCircle2,
      to: "/admin/analytics",
    },
    {
      label: "Audit Log Events",
      value: (audits ?? []).length,
      sub: "Recent security trail",
      icon: ScrollText,
      to: "/admin/audit",
    },
  ];

  const moduleShortcuts = [
    { label: "🚨 Incidents", to: "/admin/incidents", icon: Siren },
    { label: "👥 Users", to: "/admin/users", icon: Users },
    { label: "🛡️ Safety Information", to: "/admin/safety", icon: Shield },
    { label: "🏥 Emergency Resources", to: "/admin/resources", icon: Building2 },
    { label: "⚠️ Safety Alerts", to: "/admin/alerts", icon: AlertTriangle },
    { label: "🗺️ Live Map", to: "/admin/map", icon: Map },
    { label: "📊 Analytics", to: "/admin/analytics", icon: BarChart3 },
    { label: "📜 Audit Logs", to: "/admin/audit", icon: ScrollText },
    { label: "🔔 Notifications", to: "/admin/notifications", icon: Bell },
    { label: "👤 Profile", to: "/admin/profile", icon: User },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrator Command Dashboard"
        desc="Global operational oversight, responder dispatch governance, verified directory management, and audit logs."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/map">
              <Map className="h-4 w-4 mr-1.5" /> Live Map
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/incidents">
              <Siren className="h-4 w-4 mr-1.5" /> Manage Incidents
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to={k.to}
              className={`rounded-xl border p-4 transition-colors hover:border-primary/50 shadow-2xs ${
                k.danger ? "border-destructive/30 bg-destructive/5" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{k.label}</span>
                <Icon className={`h-4 w-4 ${k.danger ? "text-destructive" : "text-primary"}`} />
              </div>
              <p className={`mt-2 text-2xl font-bold ${k.danger ? "text-destructive" : ""}`}>
                {k.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Module Directory */}
      <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
        <h2 className="text-sm font-semibold text-foreground">Administrator Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {moduleShortcuts.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5 text-xs font-medium hover:border-primary/40 hover:bg-muted/50 transition-colors"
            >
              <span className="truncate">{m.label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* Active Incidents & Recent Audit Logs */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Active Incidents Queue</h2>
            <Link
              to="/admin/incidents"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all incidents →
            </Link>
          </div>
          {!metrics.recentActive.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No active incidents requiring attention right now.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {metrics.recentActive.map((inc) => (
                <Link
                  key={inc.id}
                  to="/admin/incidents/$incidentId"
                  params={{ incidentId: inc.id }}
                  className="flex items-center justify-between gap-3 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{inc.ref}</span>
                      <SeverityBadge severity={inc.severity} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {KIND_LABEL[inc.kind]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate">{inc.category}</p>
                    <p className="text-xs text-muted-foreground">
                      Reporter: {inc.reporter?.full_name || inc.reporter?.email || "Tourist"} ·{" "}
                      {inc.responder?.full_name
                        ? `Assigned: ${inc.responder.full_name}`
                        : "Unassigned"}
                    </p>
                  </div>
                  <StatusBadge status={inc.status} kind={inc.kind} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-xl border bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Recent Audit Logs</h2>
            <Link to="/admin/audit" className="text-xs font-medium text-primary hover:underline">
              Full audit log →
            </Link>
          </div>
          {!metrics.recentAudits.length ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
              No audit events recorded yet.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {metrics.recentAudits.map((a) => (
                <div key={a.id} className="p-3 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold uppercase text-foreground">{a.action}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(a.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Entity: <span className="font-mono">{a.entity}</span> · Actor:{" "}
                    {a.actor?.full_name || a.actor?.email || "System"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
