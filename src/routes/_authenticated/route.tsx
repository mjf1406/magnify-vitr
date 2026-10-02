import { AllowedEmailGuard } from "@/components/auth/AllowedEmailGuard";
import PendingComponent from "@/components/loading/PendingComponent";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

function relativeLocationHref(location: { href: string }): string {
  try {
    const url = new URL(location.href, "http://local.invalid");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (context.auth.isLoading) {
      return;
    }
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: relativeLocationHref(location) },
      });
    }
    if (!context.auth.isAllowed) {
      throw redirect({ to: "/unauthorized" });
    }
  },
  component: function AuthenticatedLayout() {
    const { auth } = Route.useRouteContext();

    if (!auth.isLoading && !auth.isAuthenticated) {
      return null;
    }

    if (auth.isLoading) {
      return <PendingComponent inset />;
    }

    return (
      <>
        <AllowedEmailGuard />
        <Outlet />
      </>
    );
  },
});
