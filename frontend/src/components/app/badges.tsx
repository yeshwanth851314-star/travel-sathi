import { cn } from "@/lib/utils";
import { statusLabel, type Kind, type Severity, type Status } from "@/lib/constants";
import { ShieldCheck, AlertTriangle } from "lucide-react";

const SEV_CLS: Record<Severity, string> = {
  low: "border-sev-low text-sev-low",
  medium: "border-sev-medium text-foreground bg-sev-medium/15",
  high: "border-sev-high text-sev-high bg-sev-high/10",
  critical: "border-sev-critical bg-sev-critical text-destructive-foreground",
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        SEV_CLS[severity],
        className,
      )}
    >
      {severity === "critical" && <AlertTriangle className="h-3 w-3" aria-hidden />}
      {severity}
    </span>
  );
}

export function StatusBadge({ status, kind }: { status: Status; kind?: Kind }) {
  const cls =
    status === "resolved"
      ? "bg-success text-success-foreground"
      : status === "cancelled"
        ? "bg-muted text-muted-foreground"
        : status === "submitted"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
      {statusLabel(status, kind)}
    </span>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded bg-success/15 px-1.5 py-0.5 text-[11px] font-bold text-success">
      <ShieldCheck className="h-3 w-3" aria-hidden /> ✓ VERIFIED
    </span>
  ) : (
    <span className="inline-flex rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Not verified
    </span>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex rounded border border-dashed border-warning px-1.5 py-0.5 text-[10px] font-bold uppercase text-warning-foreground bg-warning/20">
      Demo data
    </span>
  );
}
