import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useIncidents } from "@/lib/queries";
import {
  ACTIVE_STATUSES,
  ASSISTANCE_CATEGORIES,
  INCIDENT_CATEGORIES,
  isActive,
  KIND_LABEL,
  SEVERITIES,
  SEVERITY_RANK,
  STATUSES,
  statusLabel,
  type Kind,
  type Severity,
  type Status,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/incidents/")({
  component: ResponderIncidentsList,
});

const ALL_CATEGORIES = Array.from(
  new Set(["SOS Emergency", ...INCIDENT_CATEGORIES, ...ASSISTANCE_CATEGORIES]),
);

function ResponderIncidentsList() {
  const { user } = Route.useRouteContext();
  const { data: incidents, isLoading, error } = useIncidents();

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [kind, setKind] = useState<Kind | "">("");
  const [status, setStatus] = useState<Status | "active">("active");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    return (incidents ?? [])
      .filter((i) => {
        if (status === "active") return isActive(i.status);
        return !status || i.status === status;
      })
      .filter((i) => !severity || i.severity === severity)
      .filter((i) => !kind || i.kind === kind)
      .filter((i) => !category || i.category === category)
      .filter((i) => {
        if (!search) return true;
        const hay =
          `${i.ref} ${i.category} ${i.description ?? ""} ${i.location_text ?? ""} ${i.reporter?.full_name ?? ""} ${i.reporter?.email ?? ""}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      })
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [incidents, status, severity, kind, category, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Incidents Queue"
        desc="Monitor, filter, and respond to tourist SOS alerts, incident reports, and assistance requests."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-2xs">
        <Input
          placeholder="Search ref, tourist, location, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status | "active")}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="active">All Active ({ACTIVE_STATUSES.length} statuses)</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value as Severity | "")}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by severity"
        >
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as Kind | "")}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by kind"
        >
          <option value="">All types</option>
          <option value="sos">SOS</option>
          <option value="incident">Incident Report</option>
          <option value="assistance">Assistance Request</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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
          title="No incidents match your current filters"
          hint="Try clearing a filter or switching from Active to a specific status."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inc) => (
            <Link
              key={inc.id}
              to="/responder/incidents/$incidentId"
              params={{ incidentId: inc.id }}
              className="block rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors shadow-2xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold">{inc.ref}</span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium">
                      {KIND_LABEL[inc.kind]}
                    </span>
                    <h3 className="font-semibold text-base">{inc.category}</h3>
                  </div>
                  {inc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{inc.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                    <span>
                      Tourist:{" "}
                      <strong className="text-foreground">
                        {inc.reporter?.full_name || inc.reporter?.email || "Unknown"}
                      </strong>
                    </span>
                    <span>Reported: {format(new Date(inc.created_at), "PP p")}</span>
                    {inc.location_text && <span>📍 {inc.location_text}</span>}
                    {inc.latitude !== null && inc.longitude !== null && (
                      <span className="font-mono">
                        ({inc.latitude.toFixed(4)}, {inc.longitude.toFixed(4)})
                      </span>
                    )}
                    <span>
                      Assigned:{" "}
                      <strong className="text-foreground">
                        {inc.assigned_responder_id === user.id
                          ? "You"
                          : inc.responder?.full_name || "Unassigned"}
                      </strong>
                    </span>
                  </div>
                </div>
                <StatusBadge status={inc.status} kind={inc.kind} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
