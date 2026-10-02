import { useMemo } from "react";

import { db } from "@/lib/instant/db";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

import { mapConversation, type SavedConversation } from "./mapRow";

export function useConversation(conversationId: Id<"conversations"> | null) {
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const canQuery = Boolean(user && isAllowedEmail(user.email) && conversationId);

  const query = db.useQuery(
    canQuery && conversationId
      ? {
          conversations: {
            $: { where: { id: conversationId } },
            messages: {},
          },
        }
      : null,
  );

  const data = useMemo<SavedConversation | null>(() => {
    if (!canQuery) return null;
    const row = query.data?.conversations[0];
    return row ? mapConversation(row) : null;
  }, [canQuery, query.data]);

  const isPending = isAuthLoading || (canQuery && query.isLoading);
  return {
    data,
    isPending,
    isError: Boolean(query.error),
    error: query.error,
    isMissing: Boolean(conversationId) && !isPending && !query.error && data === null,
  };
}
