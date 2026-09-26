import { lazy, Suspense, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

  const skeletonMap = (
    <div
      style={{ height }}
      className="relative overflow-hidden rounded-xl border bg-card p-4"
      role="status"
      aria-label="Loading interactive map…"
    >
      <Skeleton className="h-full w-full rounded-lg" />
      <div className="absolute left-7 top-7 space-y-1.5">
        <Skeleton className="h-8 w-8 rounded-md bg-background/80" />
        <Skeleton className="h-8 w-8 rounded-md bg-background/80" />
      </div>
      <div className="absolute right-7 top-7">
        <Skeleton className="h-7 w-28 rounded-full bg-background/80" />
      </div>
      <div className="absolute bottom-7 left-7">
        <Skeleton className="h-5 w-40 rounded bg-background/80" />
      </div>
    </div>
  );

  if (!mounted) return skeletonMap;
  return (
    <Suspense fallback={skeletonMap}>
      <LeafletMap markers={markers} height={height} />
    </Suspense>
  );
}
