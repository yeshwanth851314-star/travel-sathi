import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Home, Siren, ClipboardCheck, Map, Bell, History, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/responder", label: "🏠 Dashboard", icon: Home, exact: true },
  { to: "/responder/incidents", label: "🚨 Active Incidents", icon: Siren },
  { to: "/responder/assigned", label: "📋 Assigned Incidents", icon: ClipboardCheck },
  { to: "/responder/map", label: "🗺️ Live Map", icon: Map },
  { to: "/responder/notifications", label: "🔔 Notifications", icon: Bell },
  { to: "/responder/history", label: "📜 Incident History", icon: History },
  { to: "/responder/profile", label: "👤 Profile", icon: User },
];

export const Route = createFileRoute("/_authenticated/responder")({
  beforeLoad: ({ context }) => {
    if (context.role !== "responder") throw redirect({ to: roleHome(context.role) });
  },
  component: ResponderLayout,
});

function ResponderLayout() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell
      userId={user.id}
      roleLabel="Responder"
      nav={NAV}
      notificationsTo="/responder/notifications"
    >
      <Outlet />
    </AppShell>
  );
}
