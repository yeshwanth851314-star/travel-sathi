import { format } from "date-fns";
import { useTimeline } from "@/lib/queries";
import { Loading, ErrorState, Empty } from "./states";

export function Timeline({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error } = useTimeline(incidentId);
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  if (!data?.length) return <Empty title="No timeline events yet" />;
  return (
    <ol className="relative ml-2 border-l pl-4 space-y-3">
      {data.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
          <div className="flex flex-wrap items-baseline gap-2">
            <time className="text-xs tabular-nums text-muted-foreground">
              {format(new Date(e.created_at), "MMM d, HH:mm:ss")}
            </time>
            <span className="text-sm font-medium">{e.event}</span>
          </div>
          {e.details && <p className="text-xs text-muted-foreground">{e.details}</p>}
        </li>
      ))}
    </ol>
  );
}
