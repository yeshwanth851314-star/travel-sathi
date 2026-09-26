import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CircleHelp, LogOut, Moon, PhoneCall, Sun } from "lucide-react";
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
  const [isDark, setIsDark] = useState(true);

  const currentRole: Role =
    roleLabel.toLowerCase() === "admin"
      ? "admin"
      : roleLabel.toLowerCase() === "responder"
        ? "responder"
        : "tourist";

  useEffect(() => {
    try {
      setIsDark(document.documentElement.classList.contains("dark"));
      const seen = localStorage.getItem(getWalkthroughStorageKey(userId, roleLabel));
      if (!seen) {
        setWalkthroughOpen(true);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [userId, roleLabel]);

  function toggleTheme() {
    try {
      const nextDark = !document.documentElement.classList.contains("dark");
      document.documentElement.classList.toggle("dark", nextDark);
      localStorage.setItem("travel_sathi_theme", nextDark ? "dark" : "light");
      setIsDark(nextDark);
    } catch {
      // ignore
    }
  }

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
    <div className="min-h-screen bg-background bg-tactical-grid">
      <header className="sticky top-0 z-30 border-b bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex h-15 max-w-7xl items-center gap-2 sm:gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold shrink-0 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/15 text-lg shadow-xs group-hover:scale-105 transition-transform">
              🚑
            </span>
            <div className="hidden xs:flex flex-col leading-none">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-foreground">
                Travel Sathi
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-emerald-500 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TACTICAL SAFETY GRID
              </span>
            </div>
          </Link>

          {/* Instant Role / Portal Switcher */}
          <div
            className="flex items-center rounded-xl border bg-muted/60 p-1 text-xs shadow-2xs"
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
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              GNSS LIVE · 112 READY
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-lg border bg-muted/40 p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle color theme"
              title={isDark ? "Switch to Daylight Mode" : "Switch to Obsidian Command Dark Mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="flex items-center gap-1 rounded-lg border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Open quick walkthrough"
              title="Quick Tour"
            >
              <CircleHelp className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Quick Tour</span>
            </button>
            <Link
              to={notificationsTo}
              className="relative rounded-lg border bg-muted/40 p-2 hover:bg-muted transition-colors"
              aria-label={`Notifications, ${unread} unread`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4.5 rounded-full bg-destructive px-1 text-center font-mono text-[10px] font-bold leading-4.5 text-destructive-foreground shadow-xs">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">🚪 Logout</span>
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
        <nav className="sticky top-15 hidden h-[calc(100vh-3.75rem)] w-64 shrink-0 flex-col justify-between overflow-y-auto border-r bg-sidebar/75 backdrop-blur-md p-3.5 md:flex">
          <div className="space-y-3">
            <div className="rounded-xl border bg-muted/40 px-3 py-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Console
              </span>
              <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary">
                {roleLabel}
              </span>
            </div>
            <ul className="space-y-1">
              {nav.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    activeOptions={{ exact: !!n.exact }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all"
                    activeProps={{
                      className:
                        "bg-primary/15 !text-primary font-semibold border border-primary/30 shadow-2xs",
                    }}
                  >
                    <n.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{n.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2.5 border-t pt-3 mt-2">
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                <PhoneCall className="h-3.5 w-3.5" /> 24/7 Emergency Lines
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                National SOS: <strong className="text-foreground">112</strong> · Ambulance:{" "}
                <strong className="text-foreground">108</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-destructive hover:bg-destructive/15 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" /> 🚪 Logout
            </button>
          </div>
        </nav>
        <div className="min-w-0 flex-1">
          {/* mobile scrollable nav */}
          <nav className="flex items-center gap-1.5 overflow-x-auto border-b bg-card/60 backdrop-blur px-2.5 py-2 md:hidden">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: !!n.exact }}
                className="whitespace-nowrap rounded-full border border-transparent px-3 py-1.5 text-xs text-muted-foreground"
                activeProps={{
                  className: "bg-primary/15 !text-primary border-primary/30 font-semibold",
                }}
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              🚪 Logout
            </button>
          </nav>
          <main className={cn("p-4 md:p-6", mobileBottom && "pb-24 md:pb-6")}>{children}</main>
        </div>
      </div>
      {mobileBottom && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t bg-card/95 backdrop-blur-lg md:hidden">
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
