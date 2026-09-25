import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useAlerts } from "@/lib/queries";
import { SEVERITIES, type Severity } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { DemoBadge, SeverityBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/tourist/alerts")({
  component: TouristAlertsPage,
});

function TouristAlertsPage() {
  const { data, isLoading, error } = useAlerts(false);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");

  const filtered = useMemo(
    () =>
      (data ?? [])
        .filter((a) => !severity || a.severity === severity)
        .filter(
          (a) =>
            !search ||
            `${a.title} ${a.message} ${a.area ?? ""}`.toLowerCase().includes(search.toLowerCase()),
        ),
    [data, severity, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Alerts"
        desc="Real-time regional safety advisories, weather warnings, and transport updates."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search alerts by title, message, or area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity | "")}
          className="h-9 rounded-md border bg-card px-2.5 text-sm"
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !filtered.length ? (
        <Empty
          title="No active safety alerts match your filter"
          hint="All monitored zones are currently clear or no alerts match your search."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border-l-4 border-l-warning border bg-card p-4 space-y-2 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <DemoBadge show={a.is_demo} />
                  <h3 className="font-semibold text-base text-foreground">{a.title}</h3>
                </div>
                {a.is_active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
                    Active Advisory
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                {a.area && (
                  <span>
                    <strong className="text-foreground">Area:</strong> {a.area}
                  </span>
                )}
                <span>
                  <strong className="text-foreground">Effective:</strong>{" "}
                  {format(new Date(a.starts_at), "PP p")}
                </span>
                {a.ends_at && (
                  <span>
                    <strong className="text-foreground">Expires:</strong>{" "}
                    {format(new Date(a.ends_at), "PP p")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
