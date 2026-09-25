import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Siren } from "lucide-react";
import { useIncidents, useResources } from "@/lib/queries";
import { isActive, statusLabel } from "@/lib/constants";
import { MapView, type MapMarker } from "@/components/app/MapView";
import { PageHeader } from "@/components/app/states";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";

export const Route = createFileRoute("/_authenticated/responder/map")({
  component: ResponderMapPage,
});

function ResponderMapPage() {
  const { data: incidents } = useIncidents();
  const { data: resources } = useResources();

  const [onlyActive, setOnlyActive] = useState(true);
  const [showResources, setShowResources] = useState(true);

  const visibleIncidents = useMemo(
    () =>
      (incidents ?? []).filter(
        (i) => (!onlyActive || isActive(i.status)) && i.latitude !== null && i.longitude !== null,
      ),
    [incidents, onlyActive],
  );

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    for (const i of visibleIncidents) {
      list.push({
        id: `inc-${i.id}`,
        lat: i.latitude!,
        lng: i.longitude!,
        label: `${i.ref} · ${i.category} (${statusLabel(i.status, i.kind)})`,
        kind: "incident",
        critical: i.severity === "critical" || i.kind === "sos",
      });
    }
    if (showResources) {
      for (const r of resources ?? []) {
        if (r.latitude !== null && r.longitude !== null) {
          list.push({
            id: `res-${r.id}`,
            lat: r.latitude,
            lng: r.longitude,
            label: `${r.name} (${r.type})${r.phone ? ` · ${r.phone}` : ""}`,
            kind: "resource",
          });
        }
      }
    }
    return list;
  }, [visibleIncidents, showResources, resources]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Responder Operational Map"
        desc="Live geospatial view of active SOS calls, tourist incidents, and emergency response facilities."
      />

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3 text-sm shadow-2xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          <Siren className="h-4 w-4 text-destructive" />
          <span>Active incidents only ({visibleIncidents.length} mapped)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showResources}
            onChange={(e) => setShowResources(e.target.checked)}
          />
          <Building2 className="h-4 w-4 text-primary" />
          <span>Show emergency resources</span>
        </label>
      </div>

      <MapView markers={markers} height={500} />

      {visibleIncidents.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">Mapped Incidents</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleIncidents.map((inc) => (
              <Link
                key={inc.id}
                to="/responder/incidents/$incidentId"
                params={{ incidentId: inc.id }}
                className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold">{inc.ref}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">{inc.category}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {inc.reporter?.full_name || inc.reporter?.email || "Tourist"}
                  </p>
                </div>
                <StatusBadge status={inc.status} kind={inc.kind} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
