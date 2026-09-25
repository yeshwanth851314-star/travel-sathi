export type GeoResult =
  | { ok: true; latitude: number; longitude: number; accuracy: number }
  | { ok: false; reason: string };

export function getLocation(timeout = 10000): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, reason: "Location is not supported on this device." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          ok: true,
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          accuracy: p.coords.accuracy,
        }),
      (e) =>
        resolve({
          ok: false,
          reason:
            e.code === e.PERMISSION_DENIED
              ? "Location access is disabled. You can still request help, but responders may have difficulty locating you."
              : "Your location could not be determined right now.",
        }),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    );
  });
}
