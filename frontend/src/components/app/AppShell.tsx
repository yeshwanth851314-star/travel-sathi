import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CircleHelp, LogOut, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/lib/queries";
import { errMsg, roleHome, type Role } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  OnboardingWalkthrough,
  getWalkthroughStorageKey,
} from "@/components/app/OnboardingWalkthrough";

export type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };

export function AppShell({
  userId,
  roleLabel,
  nav,
  notificationsTo,
  mobileBottom,
  children,
}: {
  userId: string;
  roleLabel: string;
  nav: NavItem[];
  notificationsTo: string;
  mobileBottom?: NavItem[];
  children: React.ReactNode;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: notes } = useNotifications(userId);
  const unread = notes?.filter((n) => !n.is_read).length ?? 0;
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  const currentRole: Role =
    roleLabel.toLowerCase() === "admin"
      ? "admin"
      : roleLabel.toLowerCase() === "responder"
        ? "responder"
        : "tourist";

  useEffect(() => {
    try {
      const seen = localStorage.getItem(getWalkthroughStorageKey(userId, roleLabel));
      if (!seen) {
        setWalkthroughOpen(true);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [userId, roleLabel]);

  async function handleSwitchRole(nextRole: Role) {
    if (nextRole === currentRole || switchingRole) return;
    setSwitchingRole(true);
    try {
      const { error } = await supabase.rpc("switch_my_role", { _role: nextRole });
      if (error) throw error;
      await qc.invalidateQueries();
      toast.success(
        `Switched to ${nextRole === "admin" ? "Administrator" : nextRole === "responder" ? "Responder" : "Tourist"} dashboard`,
      );
      navigate({ to: roleHome(nextRole) });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSwitchingRole(false);
    }
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 sm:gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold shrink-0">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
            <span className="hidden xs:inline">Travel Sathi</span>
          </Link>

          {/* Instant Role / Portal Switcher */}
          <div
            className="flex items-center rounded-lg border bg-muted/60 p-0.5 text-xs"
            role="group"
            aria-label="Switch active role dashboard"
          >
            {(
              [
                { role: "tourist", label: "🧳 Tourist" },
                { role: "responder", label: "🚨 Responder" },
                { role: "admin", label: "🛡️ Admin" },
              ] as const
            ).map((item) => {
              const active = currentRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  disabled={switchingRole}
                  onClick={() => handleSwitchRole(item.role)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-background text-foreground shadow-2xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="flex items-center gap-1 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Open quick walkthrough"
              title="Quick Tour"
            >
              <CircleHelp className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Tour</span>
            </button>
            <Link
              to={notificationsTo}
              className="relative rounded-md p-2 hover:bg-muted"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-destructive px-1 text-center text-[11px] font-bold leading-5 text-destructive-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">🚪 Logout</span>
            </button>
          </div>
        </div>
      </header>
      <OnboardingWalkthrough
        userId={userId}
        roleLabel={roleLabel}
        open={walkthroughOpen}
        onOpenChange={setWalkthroughOpen}
      />
      <div className="mx-auto flex max-w-7xl">
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col justify-between overflow-y-auto border-r p-3 md:flex">
          <ul className="space-y-0.5">
            {nav.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: !!n.exact }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-accent !text-accent-foreground font-medium" }}
                >
                  <n.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t pt-2 mt-2">
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" /> 🚪 Logout
            </button>
          </div>
        </nav>
        <div className="min-w-0 flex-1">
          {/* mobile scrollable nav */}
          <nav className="flex items-center gap-1 overflow-x-auto border-b px-2 py-2 md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: !!n.exact }}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-muted-foreground"
                activeProps={{ className: "bg-accent !text-accent-foreground font-medium" }}
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              🚪 Logout
            </button>
          </nav>
          <main className={cn("p-4 md:p-6", mobileBottom && "pb-24 md:pb-6")}>{children}</main>
        </div>
      </div>
      {mobileBottom && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card md:hidden">
          {mobileBottom.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: !!n.exact }}
              className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
              activeProps={{ className: "!text-primary font-semibold" }}
            >
              <n.icon className="h-5 w-5" /> {n.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
