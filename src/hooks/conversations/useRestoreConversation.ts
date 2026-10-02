import { useCallback } from "react";

import { db } from "@/lib/instant/db";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

import type { SavedConversation } from "./mapRow";

/** Put a deleted conversation and its messages back. The undo toast reports failure. */
export function useRestoreConversation() {
  const { user } = db.useAuth();

  return useCallback(
    (conversation: SavedConversation) => {
      if (!user || !isAllowedEmail(user.email)) {
        return Promise.reject(new Error("Not signed in"));
      }
      const conversationId: Id<"conversations"> = conversation.id;
      return db
        .transact([
          db.tx.conversations[conversationId]
            .update({
              otherName: conversation.otherName,
              createdAt: conversation.createdAt,
              updatedAt: conversation.updatedAt,
            })
            .link({ owner: user.id }),
          ...conversation.messages.map((message) =>
            db.tx.messages[message.id as Id<"messages">]
              .update({
                text: message.text,
                sender: message.sender,
                createdAt: message.createdAt,
              })
              .link({ conversation: conversationId }),
          ),
        ])
        .then(() => undefined);
    },
    [user],
  );
}
