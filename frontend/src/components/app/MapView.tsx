import { lazy, Suspense, useEffect, useState } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  kind: "me" | "incident" | "resource";
  critical?: boolean;
};

const LeafletMap = lazy(() => import("./LeafletMap"));

export function MapView({ markers, height = 420 }: { markers: MapMarker[]; height?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const box = (
    <div
      style={{ height }}
      className="grid place-items-center rounded-lg border bg-muted text-sm text-muted-foreground"
    >
      Loading map…
    </div>
  );
  if (!mounted) return box;
  return (
    <Suspense fallback={box}>
      <LeafletMap markers={markers} height={height} />
    </Suspense>
  );
}
