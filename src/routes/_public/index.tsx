import { createFileRoute, redirect } from "@tanstack/react-router";

import { PublicHomePage } from "@/components/home/PublicHomePage";
import { PUBLIC_READ } from "../../../instant.perms";

export const Route = createFileRoute("/_public/")({
  beforeLoad: ({ context }) => {
    if (PUBLIC_READ) {
      return;
    }
    if (context.auth.isLoading) {
      return;
    }
    if (context.auth.isAuthenticated && context.auth.isAllowed) {
      throw redirect({ to: "/files" });
    }
    throw redirect({ to: "/login" });
  },
  component: PublicHomePage,
});
