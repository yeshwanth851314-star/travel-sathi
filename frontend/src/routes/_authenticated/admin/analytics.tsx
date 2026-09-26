import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
import { BarChart3, CheckCircle2, Siren, TrendingUp, Users } from "lucide-react";
import { useAllUsers, useIncidents } from "@/lib/queries";
import { isActive, KIND_LABEL, SEVERITIES, STATUSES, statusLabel } from "@/lib/constants";
import { ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalyticsPage,
});

const PIE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

function AdminAnalyticsPage() {
  const { data: users, isLoading: uLoad, error: uErr } = useAllUsers();
  const { data: incidents, isLoading: iLoad, error: iErr } = useIncidents();

  const analytics = useMemo(() => {
    const uList = users ?? [];
    const iList = incidents ?? [];
    const activeInc = iList.filter((i) => isActive(i.status));
    const resolvedInc = iList.filter((i) => i.status === "resolved");

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

    const categoryMap = new Map<string, number>();
    for (const inc of iList) {
      categoryMap.set(inc.category, (categoryMap.get(inc.category) ?? 0) + 1);
    }
    const topCategories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const resolutionRate = iList.length ? Math.round((resolvedInc.length / iList.length) * 100) : 0;

    return {
      totalIncidents: iList.length,
      activeCount: activeInc.length,
      resolvedCount: resolvedInc.length,
      resolutionRate,
      totalUsers: uList.length,
      byKind,
      bySeverity,
      byStatus,
      last7Days,
      topCategories,
    };
  }, [users, incidents]);

  if (uLoad || iLoad) return <Loading />;
  if (uErr || iErr) return <ErrorState error={uErr ?? iErr} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Trends"
        desc="Visual breakdown of incident volume, severity distribution, lifecycle progression, and category trends."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total Incidents Logged</span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{analytics.totalIncidents}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Currently Active</span>
            <Siren className="h-4 w-4 text-destructive" />
          </div>
          <p className="mt-2 text-2xl font-bold">{analytics.activeCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Resolution Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold">{analytics.resolutionRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {analytics.resolvedCount} resolved cases
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Registered Accounts</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold">{analytics.totalUsers}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Incidents by Type (SOS vs Report vs Assistance)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byKind}>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.bySeverity}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {analytics.bySeverity.map((_, idx) => (
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.byStatus} layout="vertical">
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.last7Days}>
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

      {analytics.topCategories.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Top Reported Categories</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {analytics.topCategories.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm"
              >
                <span className="truncate font-medium">{c.name}</span>
                <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
