import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Megaphone,
  Shield,
  Siren,
  Users,
} from "lucide-react";
import { useAlerts, useAllUsers, useIncidents, useResources, useSafetyInfo } from "@/lib/queries";
import { isActive, KIND_LABEL, SEVERITIES, STATUSES, statusLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

function AdminDashboard() {
  const { data: users, isLoading: uLoad, error: uErr } = useAllUsers();
  const { data: incidents, isLoading: iLoad, error: iErr } = useIncidents();
  const { data: alerts } = useAlerts(false);
  const { data: resources } = useResources();
  const { data: safetyInfo } = useSafetyInfo();

  const metrics = useMemo(() => {
    const uList = users ?? [];
    const iList = incidents ?? [];
    const activeInc = iList.filter((i) => isActive(i.status));

    const byKind = (["sos", "incident", "assistance"] as const).map((k) => ({
      name: KIND_LABEL[k],
      count: iList.filter((i) => i.kind === k).length,
    }));

    const bySeverity = SEVERITIES.map((s) => ({
      name: s.toUpperCase(),
      count: iList.filter((i) => i.severity === s).length,
    }));

    const byStatus = STATUSES.map((st) => ({
      name: statusLabel(st) ?? st,
      count: iList.filter((i) => i.status === st).length,
    })).filter((d) => d.count > 0);

    const last7Days = Array.from({ length: 7 }, (_, idx) => {
      const d = subDays(new Date(), 6 - idx);
      const dayKey = format(d, "yyyy-MM-dd");
      return {
        date: format(d, "MMM d"),
        count: iList.filter((i) => i.created_at.startsWith(dayKey)).length,
      };
    });

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
      activeAlerts: (alerts ?? []).length,
      verifiedResources: (resources ?? []).filter((r) => r.is_verified).length,
      publishedArticles: (safetyInfo ?? []).filter((s) => s.is_published).length,
      byKind,
      bySeverity,
      byStatus,
      last7Days,
    };
  }, [users, incidents, alerts, resources, safetyInfo]);

  if (uLoad || iLoad) return <Loading />;
  if (uErr || iErr) return <ErrorState error={uErr ?? iErr} />;

  const kpis = [
    { label: "Total Registered Users", value: metrics.totalUsers, icon: Users, to: "/admin/users" },
    { label: "Tourists", value: metrics.tourists, icon: Users, to: "/admin/users" },
    { label: "Responders", value: metrics.responders, icon: Shield, to: "/admin/users" },
    { label: "Admins", value: metrics.admins, icon: Shield, to: "/admin/users" },
    {
      label: "Active Incidents",
      value: metrics.activeIncidents,
      icon: Siren,
      to: "/admin/incidents",
    },
    {
      label: "Critical / SOS Active",
      value: metrics.criticalIncidents,
      icon: AlertTriangle,
      to: "/admin/incidents",
      danger: true,
    },
    {
      label: "Unassigned Active",
      value: metrics.unassignedActive,
      icon: Siren,
      to: "/admin/incidents",
    },
    {
      label: "Resolved Incidents",
      value: metrics.resolvedIncidents,
      icon: CheckCircle2,
      to: "/admin/incidents",
    },
    {
      label: "Active Safety Alerts",
      value: metrics.activeAlerts,
      icon: Megaphone,
      to: "/admin/alerts",
    },
    {
      label: "Verified Resources",
      value: metrics.verifiedResources,
      icon: Building2,
      to: "/admin/resources",
    },
    {
      label: "Published Safety Guides",
      value: metrics.publishedArticles,
      icon: BookOpen,
      to: "/admin/safety",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration & Analytics"
        desc="Global operational oversight, responder dispatch governance, verified directory management, and audit logs."
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/audit">Audit Logs</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/incidents">Manage Incidents</Link>
          </Button>
        </div>
      </PageHeader>

      {/* 11 KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            </Link>
          );
        })}
      </div>

      {/* 4 Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Incidents by Type</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byKind}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Incidents by Severity</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.bySeverity}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {metrics.bySeverity.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Incidents by Lifecycle Status</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Incidents Reported (Last 7 Days)</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.last7Days}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
