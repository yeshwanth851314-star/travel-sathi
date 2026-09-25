import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/app/Notifications";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotificationsRoute,
});

function AdminNotificationsRoute() {
  const { user } = Route.useRouteContext();
  return <NotificationsPage userId={user.id} incidentBasePath="/admin/incidents" />;
}
