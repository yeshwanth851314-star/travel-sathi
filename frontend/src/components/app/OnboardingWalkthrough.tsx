import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Siren,
  FileWarning,
  MapPin,
  ClipboardCheck,
  ShieldAlert,
  Users,
  Megaphone,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WalkthroughStep = {
  title: string;
  description: string;
  highlights: string[];
  icon: LucideIcon;
  accentClass: string;
  actionLabel?: string;
  actionTo?: string;
};

const STEPS_BY_ROLE: Record<
  "tourist" | "responder" | "admin",
  [WalkthroughStep, ...WalkthroughStep[]]
> = {
  tourist: [
    {
      title: "Instant Emergency SOS",
      description:
        "In an urgent situation, trigger an SOS with one tap to broadcast your live GPS coordinates to our response team.",
      highlights: [
        "Hold or tap the SOS button to alert responders immediately",
        "Share continuous live location updates while help is en route",
        "Track responder assignment and status in real time",
      ],
      icon: Siren,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "View SOS Page",
      actionTo: "/tourist/sos",
    },
    {
      title: "Report Incidents & Request Help",
      description:
        "Need non-urgent help like a lost passport, medical guidance, or translation? Submit a report or assistance request anytime.",
      highlights: [
        "Attach photos or PDF documents as secure evidence",
        "Pin your exact location on the interactive map",
        "Follow every status update on your incident timeline",
      ],
      icon: FileWarning,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "Report an Incident",
      actionTo: "/tourist/report",
    },
    {
      title: "Safety Map, Alerts & Contacts",
      description:
        "Stay prepared with verified local resources, real-time safety advisories, and your personal emergency contacts.",
      highlights: [
        "Add a primary emergency contact so responders know who to reach",
        "Find nearby hospitals, police stations, and tourist help centers",
        "Receive instant notifications for active weather or area alerts",
      ],
      icon: MapPin,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "Add Emergency Contacts",
      actionTo: "/tourist/contacts",
    },
  ],
  responder: [
    {
      title: "Live SOS & Incident Triage",
      description:
        "Monitor incoming tourist SOS alerts and incident reports in real time, prioritized by severity.",
      highlights: [
        "Critical SOS alerts appear at the top of your queue immediately",
        "Filter active cases by severity, status, or category",
        "Self-assign unclaimed incidents with a single click",
      ],
      icon: Siren,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "Open Incident Queue",
      actionTo: "/responder/incidents",
    },
    {
      title: "Field Dispatch & Status Updates",
      description:
        "Keep tourists and command staff informed as you progress through each stage of the response.",
      highlights: [
        "Update status from Accepted → En Route → Assistance Provided → Resolved",
        "Record internal responder notes visible to staff",
        "Inspect tourist medical/travel notes and emergency contacts",
      ],
      icon: ClipboardCheck,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "Assigned to Me",
      actionTo: "/responder/assigned",
    },
    {
      title: "Operations Map & Evidence Review",
      description:
        "Visualize all active incidents and emergency facilities on the live map and inspect uploaded evidence securely.",
      highlights: [
        "View live GPS coordinates and location history trails",
        "Open signed URLs for tourist-uploaded photos and documents",
        "Review completed cases anytime in Response History",
      ],
      icon: MapPin,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "Open Operations Map",
      actionTo: "/responder/map",
    },
  ],
  admin: [
    {
      title: "Command Overview & Dispatch",
      description:
        "Monitor platform-wide safety metrics, oversee all active SOS alerts, and assign responders to incoming cases.",
      highlights: [
        "Track open SOS alerts, active incidents, and resolution metrics",
        "Assign or reassign any incident to available responders",
        "Manage status transitions and resolution notes centrally",
      ],
      icon: ShieldAlert,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "Manage Incidents",
      actionTo: "/admin/incidents",
    },
    {
      title: "Broadcast Alerts & Safety Directory",
      description:
        "Publish verified safety guides, maintain emergency resource coordinates, and broadcast live area alerts.",
      highlights: [
        "Publishing an active Safety Alert notifies all users immediately",
        "Verify and update hospitals, police stations, and embassies",
        "Manage published safety articles and review dates",
      ],
      icon: Megaphone,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "Safety Alerts",
      actionTo: "/admin/alerts",
    },
    {
      title: "User Roles & Security Audit Trail",
      description:
        "Control staff permissions and review the immutable audit log of every administrative and operational action.",
      highlights: [
        "Promote verified personnel to Responder or Admin roles",
        "Search users by name, email, or assigned role",
        "Inspect timestamped audit logs across all entities",
      ],
      icon: Users,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "Users & Roles",
      actionTo: "/admin/users",
    },
  ],
};

export function getWalkthroughStorageKey(userId: string, roleLabel: string) {
  return `travel_sathi_walkthrough_v1_${userId}_${roleLabel.toLowerCase()}`;
}

export function OnboardingWalkthrough({
  userId,
  roleLabel,
  open,
  onOpenChange,
}: {
  userId: string;
  roleLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const roleKey = roleLabel.toLowerCase();
  const steps: [WalkthroughStep, ...WalkthroughStep[]] =
    roleKey === "admin"
      ? STEPS_BY_ROLE.admin
      : roleKey === "responder"
        ? STEPS_BY_ROLE.responder
        : STEPS_BY_ROLE.tourist;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setStepIndex(0);
    }
  }, [open]);

  const current: WalkthroughStep = steps[stepIndex] ?? steps[0];
  const Icon = current.icon;
  const isLast = stepIndex === steps.length - 1;

  function markSeenAndClose() {
    try {
      localStorage.setItem(getWalkthroughStorageKey(userId, roleLabel), "done");
    } catch {
      // Ignore storage errors in restricted environments
    }
    onOpenChange(false);
  }

  function handleNext() {
    if (isLast) {
      markSeenAndClose();
    } else {
      setStepIndex((i) => Math.min(steps.length - 1, i + 1));
    }
  }

  function handlePrev() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function handleJump(to: string) {
    markSeenAndClose();
    navigate({ to });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          markSeenAndClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Top banner */}
        <div className="flex items-center justify-between border-b bg-muted/40 px-6 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {roleLabel} Quick Tour
            </span>
            <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
              {stepIndex + 1} of {steps.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markSeenAndClose}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground mr-6"
          >
            Skip tour
          </Button>
        </div>

        {/* Step body */}
        <div className="p-6 space-y-4">
          <DialogHeader className="text-left space-y-3">
            <div className="flex items-start gap-3.5">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  current.accentClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg font-display font-semibold leading-tight">
                  {current.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {current.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ul className="space-y-2 rounded-lg border bg-card p-3.5 text-sm">
            {current.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span className="text-foreground/90 text-xs sm:text-sm">{item}</span>
              </li>
            ))}
          </ul>

          {current.actionLabel && current.actionTo && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3.5 py-2.5 text-xs">
              <span className="text-muted-foreground">Want to jump straight there?</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold"
                onClick={() => handleJump(current.actionTo!)}
              >
                {current.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer with progress dots + Skip / Back / Next */}
        <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3.5">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Walkthrough steps">
            {steps.map((s, idx) => (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={idx === stepIndex}
                aria-label={`Step ${idx + 1}: ${s.title}`}
                onClick={() => setStepIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === stepIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={markSeenAndClose} className="text-xs">
              <X className="mr-1 h-3.5 w-3.5" />
              Skip
            </Button>
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} className="text-xs">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="text-xs">
              {isLast ? (
                <>
                  Get Started
                  <Check className="ml-1 h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
