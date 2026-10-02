import { useCallback } from "react";
import { id } from "@instantdb/react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import { normalizeMessageText, normalizeOtherName, type Sender } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

type SendMessageArgs = {
  conversationId?: Id<"conversations">;
  text: string;
  sender: Sender;
  otherName?: string;
};

export function useSendMessage() {
  const { user } = db.useAuth();
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (
      args: SendMessageArgs,
    ): { conversationId: Id<"conversations">; messageId: Id<"messages"> } | null => {
      if (!user || !isAllowedEmail(user.email)) {
        toast.add({ title: t("signInToSave"), type: "error" });
        return null;
      }
      const text = normalizeMessageText(args.text);
      if (!text) return null;

      const now = Date.now();
      const messageId = id();
      const conversationId = args.conversationId ?? id();
      const messageTx = db.tx.messages[messageId]
        .update({ text, sender: args.sender, createdAt: now })
        .link({ conversation: conversationId });
      const conversationTx = args.conversationId
        ? db.tx.conversations[conversationId].update({ updatedAt: now })
        : db.tx.conversations[conversationId]
            .update({
              otherName: normalizeOtherName(args.otherName ?? ""),
              createdAt: now,
              updatedAt: now,
            })
            .link({ owner: user.id });

      void db.transact([conversationTx, messageTx]).catch((error: unknown) => {
        toast.add({
          title: messageFromError(error, t("sendFailed"), tCommon("rateLimited")),
          type: "error",
        });
      });

      return { conversationId, messageId };
    },
    [t, tCommon, user],
  );
}
