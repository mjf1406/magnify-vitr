import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import { normalizeOtherName } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";

type RenameConversationArgs = {
  id: Id<"conversations">;
  otherName: string;
};

export function useRenameConversation() {
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (args: RenameConversationArgs) => {
      void db
        .transact(
          db.tx.conversations[args.id].update({
            otherName: normalizeOtherName(args.otherName),
            updatedAt: Date.now(),
          }),
        )
        .catch((error: unknown) => {
          toast.add({
            title: messageFromError(error, t("saveFailed"), tCommon("rateLimited")),
            type: "error",
          });
        });
    },
    [t, tCommon],
  );
}
