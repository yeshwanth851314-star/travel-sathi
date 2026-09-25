import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  Home,
  Siren,
  FileWarning,
  LifeBuoy,
  ListChecks,
  Users,
  BookOpen,
  Megaphone,
  Building2,
  Map,
  Bell,
  User,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/app/AppShell";
import { roleHome } from "@/lib/constants";

const NAV: NavItem[] = [
  { to: "/tourist", label: "Dashboard", icon: Home, exact: true },
  { to: "/tourist/sos", label: "SOS", icon: Siren },
  { to: "/tourist/emergency", label: "Active Emergency", icon: Siren },
  { to: "/tourist/report", label: "Report Incident", icon: FileWarning },
  { to: "/tourist/assist", label: "Request Assistance", icon: LifeBuoy },
  { to: "/tourist/incidents", label: "My Incidents", icon: ListChecks },
  { to: "/tourist/contacts", label: "Emergency Contacts", icon: Users },
  { to: "/tourist/safety", label: "Safety Information", icon: BookOpen },
  { to: "/tourist/alerts", label: "Safety Alerts", icon: Megaphone },
  { to: "/tourist/resources", label: "Emergency Resources", icon: Building2 },
  { to: "/tourist/map", label: "Map", icon: Map },
  { to: "/tourist/notifications", label: "Notifications", icon: Bell },
  { to: "/tourist/profile", label: "Profile", icon: User },
];

const BOTTOM: NavItem[] = [
  { to: "/tourist", label: "Home", icon: Home, exact: true },
  { to: "/tourist/sos", label: "SOS", icon: Siren },
  { to: "/tourist/incidents", label: "My Incidents", icon: ListChecks },
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
