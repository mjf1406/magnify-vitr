import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { db } from "@/lib/instant/db";
import { isAllowedEmail } from "../../../shared/access";

/** Sign out any authenticated account that is not the allowed Google address. */
export function AllowedEmailGuard() {
  const { user, isLoading } = db.useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;
    if (isAllowedEmail(user.email)) return;
    void db.auth.signOut().then(() => {
      void navigate({ to: "/unauthorized" });
    });
  }, [isLoading, navigate, user]);

  return null;
}
