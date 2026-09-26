import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CircleHelp, LogOut, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { setCachedRole, clearAuthCache } from "@/lib/auth";
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
      setCachedRole(userId, nextRole);
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
    clearAuthCache();
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2.5 font-display font-bold shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldAlert className="h-4 w-4" aria-hidden />
              </div>
              <span className="text-base tracking-tight text-foreground">Travel Sathi</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-border" />

            {/* Clean Role Switcher */}
            <div
              className="flex items-center rounded-lg border bg-muted/60 p-0.5 text-xs"
              role="group"
              aria-label="Switch active role dashboard"
            >
              {(
                [
                  { role: "tourist", label: "Tourist" },
                  { role: "responder", label: "Responder" },
                  { role: "admin", label: "Admin" },
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
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      active
                        ? "bg-card text-foreground shadow-2xs font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Open quick walkthrough"
              title="Quick Tour"
            >
              <CircleHelp className="h-4 w-4" />
              <span className="hidden sm:inline">Guide</span>
            </button>

            <Link
              to={notificationsTo}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
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
        <nav className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col justify-between overflow-y-auto border-r bg-sidebar px-3 py-5 md:flex">
          <div className="space-y-4">
            <div className="px-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {roleLabel} Workspace
              </p>
            </div>
            <ul className="space-y-1">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    activeOptions={{ exact: !!n.exact }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    activeProps={{
                      className: "bg-primary/10 !text-primary font-medium",
                    }}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {/* Mobile horizontal navigation */}
          <nav className="flex items-center gap-1.5 overflow-x-auto border-b bg-card px-3 py-2.5 md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: !!n.exact }}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground"
                activeProps={{
                  className: "bg-primary/10 !text-primary font-semibold",
                }}
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              Logout
            </button>
          </nav>

          <main className={cn("p-5 sm:p-6 lg:p-8", mobileBottom && "pb-24 md:pb-8")}>
            {children}
          </main>
        </div>
      </div>

      {mobileBottom && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card md:hidden">
          {mobileBottom.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: !!n.exact }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "!text-primary font-semibold" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
