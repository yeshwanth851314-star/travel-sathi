import { createFileRoute, redirect } from "@tanstack/react-router";
import { roleHome } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/home")({
  beforeLoad: ({ context }) => {
    throw redirect({ to: roleHome(context.role) });
  },
});
