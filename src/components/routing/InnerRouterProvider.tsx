import { useEffect } from "react";
import { RouterProvider, type AnyRouter } from "@tanstack/react-router";

import { db } from "@/lib/instant/db";
import { isAllowedEmail } from "../../../shared/access";

export function InnerRouterProvider({ router }: { router: AnyRouter }) {
  const { isLoading, user } = db.useAuth();
  const auth = {
    isAuthenticated: Boolean(user),
    isLoading,
    email: user?.email ?? null,
    isAllowed: isAllowedEmail(user?.email),
  };

  useEffect(() => {
    void router.invalidate();
  }, [auth.isAuthenticated, auth.isAllowed, auth.isLoading, router]);

  return <RouterProvider router={router} context={{ auth }} />;
}
