import { useMemo } from "react";

import { db } from "@/lib/instant/db";
import { isAllowedEmail } from "../../../shared/access";

import { mapConversation, type SavedConversation } from "./mapRow";

export type { SavedConversation };

export function useConversations() {
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const canQuery = Boolean(user && isAllowedEmail(user.email));

  const query = db.useQuery(
    canQuery
      ? {
          conversations: {
            $: { order: { updatedAt: "desc" } },
            messages: {},
          },
        }
      : null,
  );

  const data = useMemo<SavedConversation[]>(() => {
    if (!canQuery) return [];
    const conversations: SavedConversation[] = [];
    for (const row of query.data?.conversations ?? []) {
      const mapped = mapConversation(row);
      if (mapped) conversations.push(mapped);
    }
    return conversations;
  }, [canQuery, query.data]);

  return {
    data,
    isPending: isAuthLoading || (canQuery && query.isLoading),
    isError: Boolean(query.error),
    error: query.error,
  };
}
