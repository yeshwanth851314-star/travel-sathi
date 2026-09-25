import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, LogOut, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/lib/queries";
import { cn } from "@/lib/utils";

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

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
            Travel Sathi
          </Link>
          <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {roleLabel}
          </span>
          <div className="ml-auto flex items-center gap-1">
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
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <nav className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r p-3 md:block">
          <ul className="space-y-0.5">
            {nav.map((n) => (
              <li key={n.to}>
                <Link
                  to={n.to}
                  activeOptions={{ exact: !!n.exact }}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "bg-accent !text-accent-foreground font-medium" }}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          {/* mobile scrollable nav */}
          <nav className="flex gap-1 overflow-x-auto border-b px-2 py-2 md:hidden">
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
