import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useResources } from "@/lib/queries";
import { ResourceDirectory } from "@/components/app/SafetyBrowse";
import { MapView, type MapMarker } from "@/components/app/MapView";
import { PageHeader } from "@/components/app/states";

export const Route = createFileRoute("/_authenticated/tourist/resources")({
  component: TouristResourcesPage,
});

function TouristResourcesPage() {
  const { data: resources } = useResources();

  const markers = useMemo<MapMarker[]>(
    () =>
      (resources ?? [])
        .filter((r) => r.latitude !== null && r.longitude !== null)
        .map((r) => ({
          id: r.id,
          lat: r.latitude!,
          lng: r.longitude!,
          label: `${r.name} (${r.type})${r.phone ? ` · ${r.phone}` : ""}`,
          kind: "resource" as const,
        })),
    [resources],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Resources"
        desc="Hospitals, police stations, tourist assistance centers, and embassies with direct call and navigation links."
      />

      {markers.length > 0 && (
        <div className="rounded-xl border bg-card p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold">Resource Locations Map</h2>
            <span className="text-xs text-muted-foreground">{markers.length} mapped resources</span>
          </div>
          <MapView markers={markers} height={320} />
        </div>
      )}

      <ResourceDirectory />
    </div>
  );
}
