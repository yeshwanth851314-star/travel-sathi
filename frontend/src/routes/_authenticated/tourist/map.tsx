import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LocateFixed, Building2, Siren } from "lucide-react";
import { toast } from "sonner";
import { getLocation } from "@/lib/geo";
import { useIncidents, useResources } from "@/lib/queries";
import { statusLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MapView, type MapMarker } from "@/components/app/MapView";
import { PageHeader } from "@/components/app/states";
import { SeverityBadge, StatusBadge } from "@/components/app/badges";

export const Route = createFileRoute("/_authenticated/tourist/map")({
  component: TouristMapPage,
});

function TouristMapPage() {
  const { user } = Route.useRouteContext();
  const { data: incidents } = useIncidents({ reporterId: user.id });
  const { data: resources } = useResources();

  const [myPos, setMyPos] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showResources, setShowResources] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  const handleLocateMe = async () => {
    setLocating(true);
    const res = await getLocation();
    setLocating(false);
    if (!res.ok) {
      toast.error(res.reason);
      return;
    }
    setMyPos({ lat: res.latitude, lng: res.longitude, accuracy: res.accuracy });
    toast.success("Location updated on map.");
  };

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (myPos) {
      list.push({
        id: "me",
        lat: myPos.lat,
        lng: myPos.lng,
        label: `Your location (±${Math.round(myPos.accuracy)}m)`,
        kind: "me",
      });
    }
    if (showIncidents) {
      for (const i of incidents ?? []) {
        if (i.latitude !== null && i.longitude !== null) {
          list.push({
            id: `inc-${i.id}`,
            lat: i.latitude,
            lng: i.longitude,
            label: `${i.ref} · ${i.category} (${statusLabel(i.status, i.kind)})`,
            kind: "incident",
            critical: i.severity === "critical" || i.kind === "sos",
          });
        }
      }
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
  }, [myPos, showIncidents, showResources, incidents, resources]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Map"
        desc="Explore nearby verified emergency resources and your reported incidents. Location is only accessed when you click Locate Me."
      >
        <Button onClick={handleLocateMe} disabled={locating} variant="outline">
          <LocateFixed className="h-4 w-4 mr-1.5" />
          {locating ? "Locating…" : myPos ? "Refresh My Location" : "Locate Me"}
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showResources}
              onChange={(e) => setShowResources(e.target.checked)}
            />
            <Building2 className="h-4 w-4 text-primary" />
            <span>
              Emergency Resources ({(resources ?? []).filter((r) => r.latitude !== null).length})
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showIncidents}
              onChange={(e) => setShowIncidents(e.target.checked)}
            />
            <Siren className="h-4 w-4 text-destructive" />
            <span>
              My Incidents ({(incidents ?? []).filter((i) => i.latitude !== null).length})
            </span>
          </label>
        </div>
        {myPos && (
          <span className="text-xs text-muted-foreground">
            GPS: {myPos.lat.toFixed(5)}, {myPos.lng.toFixed(5)} (±{Math.round(myPos.accuracy)}m)
          </span>
        )}
      </div>

      <MapView markers={markers} height={480} />

      {(incidents ?? []).length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs">
          <h2 className="font-semibold text-sm">My Reported Incidents</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {(incidents ?? []).slice(0, 6).map((inc) => (
              <Link
                key={inc.id}
                to="/tourist/incidents/$incidentId"
                params={{ incidentId: inc.id }}
                className="flex items-center justify-between gap-2 rounded-lg border p-3 hover:bg-muted/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{inc.ref}</span>
                    <SeverityBadge severity={inc.severity} />
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">{inc.category}</p>
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
