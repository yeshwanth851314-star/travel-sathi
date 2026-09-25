import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useIncidents } from "@/lib/queries";
import {
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

export const Route = createFileRoute("/_authenticated/admin/incidents/")({
  component: AdminIncidentsPage,
});

function AdminIncidentsPage() {
  const { data: incidents, isLoading, error } = useIncidents();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "active" | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [kind, setKind] = useState<Kind | "">("");
  const [unassignedOnly, setUnassignedOnly] = useState(false);

  const filtered = useMemo(() => {
    return (incidents ?? [])
      .filter((i) => {
        if (statusFilter === "active") return isActive(i.status);
        return !statusFilter || i.status === statusFilter;
      })
      .filter((i) => !severity || i.severity === severity)
      .filter((i) => !kind || i.kind === kind)
      .filter((i) => !unassignedOnly || !i.assigned_responder_id)
      .filter((i) => {
        if (!search) return true;
        const hay =
          `${i.ref} ${i.category} ${i.description ?? ""} ${i.location_text ?? ""} ${i.reporter?.full_name ?? ""} ${i.reporter?.email ?? ""} ${i.responder?.full_name ?? ""}`.toLowerCase();
        return hay.includes(search.toLowerCase());
      })
      .sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [incidents, statusFilter, severity, kind, unassignedOnly, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Incidents & Dispatch Management"
        desc="Inspect all emergency SOS calls, incident reports, and assistance requests across the system."
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-2xs">
        <Input
          placeholder="Search ref, reporter, responder, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "active" | "")}
          className="h-9 rounded-md border bg-background px-2.5 text-sm"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active Only</option>
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
        <label className="flex items-center gap-2 text-sm cursor-pointer px-1">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
          />
          Unassigned only
        </label>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !filtered.length ? (
        <Empty title="No incidents found" hint="Try adjusting your search or filter criteria." />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Ref</th>
                <th className="p-3">Type & Category</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tourist</th>
                <th className="p-3">Assigned Responder</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((inc) => (
                <tr key={inc.id} className="hover:bg-muted/40 transition-colors">
                  <td className="p-3 font-mono text-xs font-bold">
                    <Link
                      to="/admin/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="text-primary hover:underline"
                    >
                      {inc.ref}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link
                      to="/admin/incidents/$incidentId"
                      params={{ incidentId: inc.id }}
                      className="font-medium hover:underline block"
                    >
                      {inc.category}
                    </Link>
                    <span className="text-xs text-muted-foreground">{KIND_LABEL[inc.kind]}</span>
                  </td>
                  <td className="p-3">
                    <SeverityBadge severity={inc.severity} />
                  </td>
                  <td className="p-3">
                    <StatusBadge status={inc.status} kind={inc.kind} />
                  </td>
                  <td className="p-3 text-xs">
                    <div className="font-medium">{inc.reporter?.full_name || "—"}</div>
                    <div className="text-muted-foreground">{inc.reporter?.email || ""}</div>
                  </td>
                  <td className="p-3 text-xs">
                    {inc.responder ? (
                      <span className="font-medium">
                        {inc.responder.full_name || inc.responder.email}
                      </span>
                    ) : (
                      <span className="text-warning font-semibold">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(inc.created_at), "MMM d, HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
