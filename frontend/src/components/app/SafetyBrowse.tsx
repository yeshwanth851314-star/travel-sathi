import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { useAlerts, useResources, useSafetyInfo } from "@/lib/queries";
import { INFO_CATEGORIES, RESOURCE_TYPES } from "@/lib/constants";
import { DemoBadge, SeverityBadge, VerifiedBadge } from "./badges";
import { Empty, ErrorState, Loading } from "./states";

function FilterSelect({
  value,
  onChange,
  options,
  all,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  all: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border bg-card px-2 text-sm"
      aria-label={all}
    >
      <option value="">{all}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

export function SafetyInfoBrowser() {
  const { data, isLoading, error } = useSafetyInfo();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const list = useMemo(
    () =>
      (data ?? [])
        .filter((i) => i.is_published)
        .filter((i) => !cat || i.category === cat)
        .filter((i) => !verifiedOnly || i.is_verified)
        .filter((i) => !q || (i.title + i.content).toLowerCase().includes(q.toLowerCase())),
    [data, q, cat, verifiedOnly],
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search safety information…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <FilterSelect
          value={cat}
          onChange={setCat}
          options={INFO_CATEGORIES}
          all="All categories"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />{" "}
          Verified only
        </label>
      </div>
      {isLoading ? (
        <Loading variant="cards" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !list.length ? (
        <Empty title="No safety information found" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((i) => (
            <details key={i.id} className="group rounded-lg border bg-card p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <VerifiedBadge verified={i.is_verified} />
                  <DemoBadge show={i.is_demo} />
                  <span className="text-xs text-muted-foreground">{i.category}</span>
                </div>
                <h3 className="font-semibold">{i.title}</h3>
                <p className="text-xs text-muted-foreground group-open:hidden">Tap to read</p>
              </summary>
              <p className="mt-3 whitespace-pre-line text-sm">{i.content.replace(/\\n/g, "\n")}</p>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <dt>Source</dt>
                <dd>{i.source || "—"}</dd>
                <dt>Verified</dt>
                <dd>{i.verified_at ? format(new Date(i.verified_at), "PP") : "—"}</dd>
                <dt>Last updated</dt>
                <dd>{format(new Date(i.updated_at), "PP")}</dd>
                <dt>Review date</dt>
                <dd>{i.review_date ? format(new Date(i.review_date), "PP") : "—"}</dd>
              </dl>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export function ResourceDirectory({
  onSelectMap,
}: { onSelectMap?: (lat: number, lng: number) => void } = {}) {
  const { data, isLoading, error } = useResources();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const list = (data ?? [])
    .filter((r) => !type || r.type === type)
    .filter((r) => !verifiedOnly || r.is_verified)
    .filter(
      (r) =>
        !q ||
        (r.name + (r.address ?? "") + (r.phone ?? "")).toLowerCase().includes(q.toLowerCase()),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search resources by name, address, phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <FilterSelect value={type} onChange={setType} options={RESOURCE_TYPES} all="All types" />
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />{" "}
          Verified only
        </label>
      </div>
      {isLoading ? (
        <Loading variant="cards" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !list.length ? (
        <Empty
          title="No emergency resources found"
          hint="Try clearing your search or type filter."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => {
            const hasCoords = r.latitude !== null && r.longitude !== null;
            const directionsUrl = hasCoords
              ? `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`
              : r.address
                ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address)}`
                : null;
            const isCallable = r.phone && !r.phone.toLowerCase().includes("not a real");

            return (
              <div
                key={r.id}
                className="rounded-xl border bg-card p-4 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-primary">{r.type}</span>
                    <VerifiedBadge verified={r.is_verified} />
                    <DemoBadge show={r.is_demo} />
                  </div>
                  <h3 className="font-semibold text-base text-foreground">{r.name}</h3>
                  {r.address && <p className="text-sm text-muted-foreground">{r.address}</p>}
                  <p className="text-sm">
                    Phone: <span className="font-medium text-foreground">{r.phone || "—"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hours: {r.operating_hours || "—"}
                    {r.last_verified_at
                      ? ` · Last verified ${format(new Date(r.last_verified_at), "PP")}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                  {r.phone && (
                    <a
                      href={isCallable ? `tel:${r.phone}` : `tel:112`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Call {isCallable ? r.phone : "Emergency (112)"}
                    </a>
                  )}
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Get Directions
                    </a>
                  )}
                  {hasCoords && onSelectMap && (
                    <button
                      type="button"
                      onClick={() => onSelectMap(r.latitude!, r.longitude!)}
                      className="inline-flex items-center gap-1.5 rounded-lg border bg-secondary px-3 py-1.5 font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Focus on Map
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AlertsList({ compact }: { compact?: boolean }) {
  const { data, isLoading, error } = useAlerts();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data?.length)
    return (
      <Empty title="No active safety alerts" hint="All monitored zones are currently clear." />
    );
  return (
    <ul className="space-y-3">
      {data.slice(0, compact ? 3 : undefined).map((a) => (
        <li
          key={a.id}
          className="rounded-xl border-l-4 border-l-warning border bg-card p-4 space-y-1.5 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={a.severity} />
              <DemoBadge show={a.is_demo} />
              <span className="font-semibold text-sm text-foreground">{a.title}</span>
            </div>
            {a.is_active && (
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
                Active Advisory
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{a.message}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
            {a.area && (
              <span>
                <strong className="text-foreground">Area:</strong> {a.area}
              </span>
            )}
            <span>
              <strong className="text-foreground">Starts:</strong>{" "}
              {format(new Date(a.starts_at), "PP p")}
            </span>
            {a.ends_at && (
              <span>
                <strong className="text-foreground">Ends:</strong>{" "}
                {format(new Date(a.ends_at), "PP p")}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
