import { Loader2, Inbox, AlertCircle } from "lucide-react";
import { errMsg } from "@/lib/constants";

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-8 px-4 text-center">
      <Inbox className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>Could not load: {errMsg(error)}</span>
    </div>
  );
}

export function PageHeader({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
