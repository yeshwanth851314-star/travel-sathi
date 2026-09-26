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
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed bg-muted/20 py-10 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground max-w-sm">{hint}</p>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{title}</h1>
        {desc && <p className="text-sm text-muted-foreground max-w-2xl">{desc}</p>}
      </div>
      {children}
    </div>
  );
}
