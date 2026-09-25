import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useIncidents } from "@/lib/queries";
import { isActive, KIND_LABEL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/history")({
  component: ResponderHistoryPage,
});

function ResponderHistoryPage() {
  const { user } = Route.useRouteContext();
  const { data: incidents, isLoading, error } = useIncidents();
  const [mineOnly, setMineOnly] = useState(false);
  const [search, setSearch] = useState("");

  const closedIncidents = useMemo(
    () =>
      (incidents ?? [])
        .filter((i) => !isActive(i.status))
        .filter((i) => !mineOnly || i.assigned_responder_id === user.id)
        .filter(
          (i) =>
            !search ||
            `${i.ref} ${i.category} ${i.resolution ?? ""} ${i.reporter?.full_name ?? ""}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        ),
    [incidents, mineOnly, user.id, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Response History"
        desc="Archive of resolved and cancelled emergency incidents and resolution summaries."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search reference, category, resolution…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => setMineOnly(e.target.checked)}
          />
          Only cases handled by me
        </label>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !closedIncidents.length ? (
        <Empty
          title="No closed incidents found"
          hint="Resolved and cancelled cases will appear here."
        />
      ) : (
        <div className="space-y-3">
          {closedIncidents.map((inc) => (
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
                  {inc.resolution && (
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Resolution:</strong> {inc.resolution}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>
                      Tourist:{" "}
                      <strong className="text-foreground">
                        {inc.reporter?.full_name || inc.reporter?.email || "Tourist"}
                      </strong>
                    </span>
                    <span>Reported: {format(new Date(inc.created_at), "PP p")}</span>
                    {inc.resolved_at && (
                      <span>Resolved: {format(new Date(inc.resolved_at), "PP p")}</span>
                    )}
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
