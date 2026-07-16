import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/portal/crm/contacts")({
  component: () => <Outlet />,
});
