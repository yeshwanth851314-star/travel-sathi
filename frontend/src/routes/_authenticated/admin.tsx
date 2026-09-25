import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Siren,
  BookOpen,
  Building2,
  Megaphone,
  Map,
  Bell,
  ScrollText,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/incidents", label: "Incidents", icon: Siren },
  { to: "/admin/users", label: "Users & Responders", icon: Users },
  { to: "/admin/safety", label: "Safety Information", icon: BookOpen },
  { to: "/admin/resources", label: "Emergency Resources", icon: Building2 },
  { to: "/admin/alerts", label: "Safety Alerts", icon: Megaphone },
  { to: "/admin/map", label: "Map", icon: Map },
  { to: "/admin/audit", label: "Audit History", icon: ScrollText },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
];

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: roleHome(context.role) });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell userId={user.id} roleLabel="Admin" nav={NAV} notificationsTo="/admin/notifications">
      <Outlet />
    </AppShell>
  );
}
