import { cn } from "@/lib/utils";
import { statusLabel, type Kind, type Severity, type Status } from "@/lib/constants";
import { ShieldCheck, AlertTriangle } from "lucide-react";

const SEV_CLS: Record<Severity, string> = {
  low: "border-sev-low/40 bg-sev-low/10 text-sev-low",
  medium: "border-sev-medium/45 bg-sev-medium/15 text-warning",
  high: "border-sev-high/50 bg-sev-high/15 text-sev-high",
  critical:
    "border-sev-critical/60 bg-sev-critical text-destructive-foreground shadow-[0_0_14px_-2px_rgba(244,63,94,0.45)]",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        SEV_CLS[severity],
        className,
      )}
    >
      {severity === "critical" && <AlertTriangle className="h-3 w-3 animate-pulse" aria-hidden />}
      {severity}
    </span>
  );
}

export function StatusBadge({ status, kind }: { status: Status; kind?: Kind }) {
  const cls =
    status === "resolved"
      ? "border border-success/40 bg-success/15 text-success"
      : status === "cancelled"
        ? "border border-border bg-muted text-muted-foreground"
        : status === "submitted"
          ? "border border-destructive/40 bg-destructive/15 text-destructive"
          : "border border-primary/40 bg-primary/15 text-primary";
  const dotCls =
    status === "resolved"
      ? "bg-success"
      : status === "cancelled"
        ? "bg-muted-foreground"
        : status === "submitted"
          ? "bg-destructive animate-ping"
          : "bg-primary animate-pulse";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight",
        cls,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotCls)} aria-hidden />
      {statusLabel(status, kind)}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-500">
      <ShieldCheck className="h-3 w-3" aria-hidden /> ✓ VERIFIED
    </span>
  ) : (
    <span className="inline-flex rounded-md border bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      Not verified
    </span>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex rounded border border-dashed border-warning/60 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-warning bg-warning/15">
      Demo data
    </span>
  );
}
