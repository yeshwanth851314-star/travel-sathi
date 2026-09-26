import { cn } from "@/lib/utils";
import { statusLabel, type Kind, type Severity, type Status } from "@/lib/constants";
import { ShieldCheck } from "lucide-react";

const SEV_CLS: Record<Severity, string> = {
  low: "border-sev-low/30 bg-sev-low/10 text-sev-low",
  medium: "border-sev-medium/40 bg-sev-medium/15 text-warning-foreground dark:text-warning",
  high: "border-sev-high/40 bg-sev-high/10 text-sev-high",
  critical: "border-sev-critical bg-sev-critical text-destructive-foreground",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        SEV_CLS[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status, kind }: { status: Status; kind?: Kind }) {
  const cls =
    status === "resolved"
      ? "bg-success/15 text-success"
      : status === "cancelled"
        ? "bg-muted text-muted-foreground"
        : status === "submitted"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary";

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cls)}
    >
      {statusLabel(status, kind)}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
      <ShieldCheck className="h-3 w-3" aria-hidden /> Verified
    </span>
  ) : (
    <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      Unverified
    </span>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex rounded border border-dashed border-warning/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning-foreground bg-warning/15">
      Demo
    </span>
  );
}
