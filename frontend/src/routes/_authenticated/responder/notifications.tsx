import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/app/Notifications";

export const Route = createFileRoute("/_authenticated/responder/notifications")({
  component: ResponderNotificationsRoute,
});

function ResponderNotificationsRoute() {
  const { user } = Route.useRouteContext();
  return <NotificationsPage userId={user.id} incidentBasePath="/responder/incidents" />;
}
