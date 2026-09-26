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
  BarChart3,
  ScrollText,
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
      title: "📍 Current Location & 🚨 Prominent SOS",
      description:
        "Welcome to Travel Sathi! Your dashboard locks onto your live GPS coordinates and keeps the Emergency SOS button front and center.",
      highlights: [
        "📍 Current Location shows your live GPS coordinates & accuracy with one-tap Refresh",
        "🚨 Prominent SOS Button broadcasts your location to responders in an emergency",
        "Track live responder dispatch status as soon as an SOS is triggered",
      ],
      icon: Siren,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "Open Emergency SOS",
      actionTo: "/tourist/sos",
    },
    {
      title: "⚠️ Active Safety Alerts & 📢 Announcements",
      description:
        "Stay ahead of local weather advisories, area warnings, and official travel safety announcements right on your dashboard.",
      highlights: [
        "⚠️ Active Safety Alerts displays real-time warnings issued for your region",
        "📢 Recent Announcements highlights verified guidance & travel advisories",
        "🔔 Notifications alerts you immediately when new safety broadcasts go live",
      ],
      icon: Megaphone,
      accentClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      actionLabel: "View Safety Alerts",
      actionTo: "/tourist/alerts",
    },
    {
      title: "📋 File a Report & 🆘 Emergency Contacts",
      description:
        "Manage your personal emergency contacts and file non-emergency incident or assistance reports anytime.",
      highlights: [
        "🆘 Emergency Contacts lets you save primary family/friends for quick calling & dispatch reference",
        "📋 Your Active / Recent Reports tracks every submitted incident & responder update",
        "Use 'File a Report' or 'Request Assistance' to attach photo/PDF evidence",
      ],
      icon: FileWarning,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "File a Report",
      actionTo: "/tourist/report",
    },
    {
      title: "🗺️ Quick Access to Map & 🏥 Nearby Resources",
      description:
        "Locate verified hospitals, police stations, fire stations, and tourist help centers sorted by distance from your GPS position.",
      highlights: [
        "🗺️ Quick Access to Map opens the interactive live map of resources and incidents",
        "🏥 Nearby Emergency Resources calculates distance (km) from your current location",
        "Tap Call on any verified hospital, police station, or help center for instant dial",
      ],
      icon: MapPin,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "Open Live Map",
      actionTo: "/tourist/map",
    },
  ],
  responder: [
    {
      title: "🏠 Dashboard & 🚨 Active Incidents",
      description:
        "Your Responder Command Center gives you real-time visibility into all active emergencies and tourist assistance requests.",
      highlights: [
        "🏠 Dashboard summarizes active queue, critical SOS count, and unassigned cases",
        "🚨 Active Incidents lets you filter by severity, status, and self-assign cases",
        "Critical SOS broadcasts appear at the top of your triage queue automatically",
      ],
      icon: Siren,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "Go to Active Incidents",
      actionTo: "/responder/incidents",
    },
    {
      title: "📋 Assigned Incidents & Field Dispatch",
      description:
        "Work through your assigned incidents and keep both the tourist and command staff updated in real time.",
      highlights: [
        "📋 Assigned Incidents lists all active cases currently assigned to you",
        "Progress status from Accepted → En Route → Assistance Provided → Resolved",
        "Add responder notes, inspect uploaded evidence, and view tourist emergency contacts",
      ],
      icon: ClipboardCheck,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "View Assigned Incidents",
      actionTo: "/responder/assigned",
    },
    {
      title: "🗺️ Live Map, 🔔 Notifications, 📜 History & 👤 Profile",
      description:
        "Navigate field operations with live GPS plotting, instant notifications, and your complete response archive.",
      highlights: [
        "🗺️ Live Map plots all active tourist SOS/incident locations & emergency facilities",
        "🔔 Notifications & 📜 Incident History track dispatch alerts and resolved cases",
        "👤 Profile & 🚪 Logout let you update your callsign/phone or sign out securely",
      ],
      icon: MapPin,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "Open Live Map",
      actionTo: "/responder/map",
    },
  ],
  admin: [
    {
      title: "🏠 Dashboard, 🚨 Incidents & 👥 Users",
      description:
        "Oversee platform-wide operations, dispatch responders to incidents, and manage user & staff roles.",
      highlights: [
        "🏠 Dashboard & 🚨 Incidents let you monitor active SOS cases and assign responders",
        "👥 Users lets you search accounts and promote verified staff to Responder or Admin",
        "Full lifecycle control over incident assignments, statuses, and resolutions",
      ],
      icon: ShieldAlert,
      accentClass: "bg-destructive/10 text-destructive border-destructive/20",
      actionLabel: "Manage Incidents",
      actionTo: "/admin/incidents",
    },
    {
      title: "🛡️ Safety Information, 🏥 Resources & ⚠️ Safety Alerts",
      description:
        "Maintain verified public safety content, emergency facility directories, and real-time area broadcasts.",
      highlights: [
        "🛡️ Safety Information manages official announcements & travel safety articles",
        "🏥 Emergency Resources maintains verified hospitals, police, fire & help centers",
        "⚠️ Safety Alerts broadcasts live warnings to all tourists and staff immediately",
      ],
      icon: Megaphone,
      accentClass: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      actionLabel: "Manage Safety Alerts",
      actionTo: "/admin/alerts",
    },
    {
      title: "🗺️ Live Map & 📊 Analytics",
      description:
        "Gain spatial awareness on the Live Map and analyze incident volume, severity, and resolution trends in Analytics.",
      highlights: [
        "🗺️ Live Map displays all active incidents and verified emergency resources",
        "📊 Analytics visualizes incidents by type, severity, status, and 7-day trends",
        "Track overall resolution rate and top reported incident categories",
      ],
      icon: BarChart3,
      accentClass: "bg-primary/10 text-primary border-primary/20",
      actionLabel: "Open Analytics",
      actionTo: "/admin/analytics",
    },
    {
      title: "📜 Audit Logs, 🔔 Notifications & 👤 Profile",
      description:
        "Ensure complete operational accountability with immutable audit logs, real-time notifications, and profile management.",
      highlights: [
        "📜 Audit Logs records every role change, alert broadcast, and incident action",
        "🔔 Notifications keeps you updated on critical SOS triggers and assignments",
        "👤 Profile & 🚪 Logout let you manage your administrator details or sign out",
      ],
      icon: ScrollText,
      accentClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      actionLabel: "View Audit Logs",
      actionTo: "/admin/audit",
    },
  ],
};

export function getWalkthroughStorageKey(userId: string, roleLabel: string) {
  return `travel_sathi_walkthrough_v2_${userId}_${roleLabel.toLowerCase()}`;
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
