import { id } from "@instantdb/react";
import { useEffect, useRef } from "react";

import { db } from "@/lib/instant/db";
import { getInitialLanguage } from "@/i18n";
import { isAllowedEmail } from "../../../shared/access";

/** Create a profile for the allowed user on first sign-in. */
export function BootstrapProfile() {
  const { user } = db.useAuth();
  const query = db.useQuery(
    user
      ? {
          profiles: { $: { where: { "$user.id": user.id } } },
        }
      : null,
  );
  const startedRef = useRef(false);

  useEffect(() => {
    if (!user || !isAllowedEmail(user.email) || query.isLoading || startedRef.current) {
      return;
    }
    if ((query.data?.profiles.length ?? 0) > 0) {
      startedRef.current = true;
      return;
    }
    startedRef.current = true;
    void db.transact(
      db.tx.profiles[id()]
        .update({
          name: user.email?.split("@")[0] ?? "",
          language: getInitialLanguage(),
          createdAt: Date.now(),
        })
        .link({ $user: user.id }),
    );
  }, [query.data, query.isLoading, user]);

  return null;
}
