import { useCallback } from "react";
import { id } from "@instantdb/react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import { normalizeOtherName } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

export function useCreateConversation() {
  const { user } = db.useAuth();
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (otherName = ""): Id<"conversations"> | null => {
      if (!user || !isAllowedEmail(user.email)) {
        toast.add({ title: t("signInToSave"), type: "error" });
        return null;
      }
      const conversationId = id();
      const now = Date.now();
      void db
        .transact(
          db.tx.conversations[conversationId]
            .update({
              otherName: normalizeOtherName(otherName),
              createdAt: now,
              updatedAt: now,
            })
            .link({ owner: user.id }),
        )
        .catch((error: unknown) => {
          toast.add({
            title: messageFromError(error, t("saveFailed"), tCommon("rateLimited")),
            type: "error",
          });
        });
      return conversationId;
    },
    [t, tCommon, user],
  );
}
