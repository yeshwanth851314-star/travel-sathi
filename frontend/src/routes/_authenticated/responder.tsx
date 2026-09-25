import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { LayoutDashboard, Siren, Map, ClipboardCheck, History, Bell, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/responder", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/responder/incidents", label: "Active Incidents", icon: Siren },
  { to: "/responder/assigned", label: "Assigned to Me", icon: ClipboardCheck },
  { to: "/responder/map", label: "Map", icon: Map },
  { to: "/responder/history", label: "Response History", icon: History },
  { to: "/responder/notifications", label: "Notifications", icon: Bell },
  { to: "/responder/profile", label: "Profile", icon: User },
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
