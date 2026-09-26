export type GeoResult =
  | { ok: true; latitude: number; longitude: number; accuracy: number }
  | { ok: false; reason: string };

let cachedGeo: { result: GeoResult; expiresAt: number } | null = null;
const GEO_TTL_MS = 60_000;

export function getLocation(timeout = 5000, forceRefresh = false): Promise<GeoResult> {
  if (!forceRefresh && cachedGeo && cachedGeo.expiresAt > Date.now()) {
    return Promise.resolve(cachedGeo.result);
  }

  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, reason: "Location is not supported on this device." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const res: GeoResult = {
          ok: true,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        };
        cachedGeo = { result: res, expiresAt: Date.now() + GEO_TTL_MS };
        resolve(res);
      },
      (e) =>
        resolve({
          ok: false,
          reason:
            e.code === e.PERMISSION_DENIED
              ? "Location access is disabled. You can still request help, but responders may have difficulty locating you."
              : "Your location could not be determined right now.",
        }),
      { enableHighAccuracy: true, timeout, maximumAge: GEO_TTL_MS },
    );
  });
}
