import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  Home,
  Siren,
  AlertTriangle,
  Megaphone,
  Map,
  Users,
  FileWarning,
  ListChecks,
  Building2,
  Bell,
  User,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/tourist", label: "Dashboard", icon: Home, exact: true },
  { to: "/tourist/sos", label: "Emergency SOS", icon: Siren },
  { to: "/tourist/alerts", label: "Active Safety Alerts", icon: AlertTriangle },
  { to: "/tourist/safety", label: "Announcements & Safety", icon: Megaphone },
  { to: "/tourist/map", label: "Live Map", icon: Map },
  { to: "/tourist/contacts", label: "Emergency Contacts", icon: Users },
  { to: "/tourist/report", label: "File a Report", icon: FileWarning },
  { to: "/tourist/incidents", label: "Active / Recent Reports", icon: ListChecks },
  { to: "/tourist/resources", label: "Nearby Resources", icon: Building2 },
  { to: "/tourist/notifications", label: "Notifications", icon: Bell },
  { to: "/tourist/profile", label: "Profile", icon: User },
];

const BOTTOM: NavItem[] = [
  { to: "/tourist", label: "Home", icon: Home, exact: true },
  { to: "/tourist/sos", label: "SOS", icon: Siren },
  { to: "/tourist/incidents", label: "Reports", icon: ListChecks },
  { to: "/tourist/map", label: "Map", icon: Map },
];

export const Route = createFileRoute("/_authenticated/tourist")({
  beforeLoad: ({ context }) => {
    if (context.role !== "tourist") throw redirect({ to: roleHome(context.role) });
  },
  component: TouristLayout,
});

function TouristLayout() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell
      userId={user.id}
      roleLabel="Tourist"
      nav={NAV}
      notificationsTo="/tourist/notifications"
      mobileBottom={BOTTOM}
    >
      <Outlet />
    </AppShell>
  );
}
