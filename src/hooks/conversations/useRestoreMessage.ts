import { useCallback } from "react";

import { db } from "@/lib/instant/db";
import type { ChatMessage } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

type RestoreMessageArgs = {
  conversationId: Id<"conversations">;
  message: ChatMessage;
};

/** Put a deleted message back. The undo toast reports failure. */
export function useRestoreMessage() {
  const { user } = db.useAuth();

  return useCallback(
    (args: RestoreMessageArgs) => {
      if (!user || !isAllowedEmail(user.email)) {
        return Promise.reject(new Error("Not signed in"));
      }
      return db
        .transact(
          db.tx.messages[args.message.id as Id<"messages">]
            .update({
              text: args.message.text,
              sender: args.message.sender,
              createdAt: args.message.createdAt,
            })
            .link({ conversation: args.conversationId }),
        )
        .then(() => undefined);
    },
    [user],
  );
}
