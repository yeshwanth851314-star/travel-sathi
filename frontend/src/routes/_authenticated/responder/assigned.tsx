import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useIncidents } from "@/lib/queries";
import { isActive, KIND_LABEL, SEVERITY_RANK } from "@/lib/constants";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";
import { Empty, ErrorState, Loading, PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/responder/assigned")({
  component: ResponderAssignedPage,
});

function ResponderAssignedPage() {
  const { user } = Route.useRouteContext();
  const { data: incidents, isLoading, error } = useIncidents({ responderId: user.id });

  const activeAssigned = useMemo(
    () =>
      (incidents ?? [])
        .filter((i) => isActive(i.status))
        .sort(
          (a, b) =>
            SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [incidents],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned to Me"
        desc="Active emergency and assistance cases currently assigned to you for response."
      />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : !activeAssigned.length ? (
        <Empty
          title="No active incidents assigned to you"
          hint="Open the Active Incidents queue to pick up unassigned cases."
        />
      ) : (
        <div className="space-y-3">
          {activeAssigned.map((inc) => (
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
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>
                      Tourist:{" "}
                      <strong className="text-foreground">
                        {inc.reporter?.full_name || inc.reporter?.email || "Tourist"}
                      </strong>
                    </span>
                    <span>Reported: {format(new Date(inc.created_at), "PP p")}</span>
                    {inc.location_text && <span>📍 {inc.location_text}</span>}
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
