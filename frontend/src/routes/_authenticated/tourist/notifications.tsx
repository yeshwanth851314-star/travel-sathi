import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/app/Notifications";

export const Route = createFileRoute("/_authenticated/tourist/notifications")({
  component: TouristNotificationsRoute,
});

function TouristNotificationsRoute() {
  const { user } = Route.useRouteContext();
  return <NotificationsPage userId={user.id} incidentBasePath="/tourist/incidents" />;
}
