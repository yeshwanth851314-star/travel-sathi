import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  Home,
  Siren,
  Users,
  Shield,
  Building2,
  AlertTriangle,
  Map,
  BarChart3,
  ScrollText,
  Bell,
  User,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/admin", label: "🏠 Dashboard", icon: Home, exact: true },
  { to: "/admin/incidents", label: "🚨 Incidents", icon: Siren },
  { to: "/admin/users", label: "👥 Users", icon: Users },
  { to: "/admin/safety", label: "🛡️ Safety Information", icon: Shield },
  { to: "/admin/resources", label: "🏥 Emergency Resources", icon: Building2 },
  { to: "/admin/alerts", label: "⚠️ Safety Alerts", icon: AlertTriangle },
  { to: "/admin/map", label: "🗺️ Live Map", icon: Map },
  { to: "/admin/analytics", label: "📊 Analytics", icon: BarChart3 },
  { to: "/admin/audit", label: "📜 Audit Logs", icon: ScrollText },
  { to: "/admin/notifications", label: "🔔 Notifications", icon: Bell },
  { to: "/admin/profile", label: "👤 Profile", icon: User },
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
