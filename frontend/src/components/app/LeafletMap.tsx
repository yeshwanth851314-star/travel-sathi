import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./MapView";

const COLORS: Record<MapMarker["kind"], string> = {
  me: "#2563eb",
  incident: "#dc2626",
  resource: "#0f766e",
};

export default function LeafletMap({ markers, height }: { markers: MapMarker[]; height: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current).setView([20, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const m of markers) {
      const c = COLORS[m.kind];
      L.circleMarker([m.lat, m.lng], {
        radius: m.kind === "me" ? 9 : m.critical ? 10 : 7,
        color: "#fff",
        weight: 2,
        fillColor: c,
        fillOpacity: 0.95,
      })
        .bindPopup(m.label)
        .addTo(layer.current);
      pts.push([m.lat, m.lng]);
    }
    if (pts.length === 1) map.current.setView(pts[0]!, 14);
    else if (pts.length > 1)
      map.current.fitBounds(L.latLngBounds(pts), { padding: [30, 30], maxZoom: 15 });
  }, [markers]);

  return <div ref={el} style={{ height }} className="z-0 rounded-lg border" />;
}
