import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import { normalizeMessageText } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";

type EditMessageArgs = {
  id: Id<"messages">;
  text: string;
};

export function useEditMessage() {
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (args: EditMessageArgs) => {
      const text = normalizeMessageText(args.text);
      if (!text) return;
      void db.transact(db.tx.messages[args.id].update({ text })).catch((error: unknown) => {
        toast.add({
          title: messageFromError(error, t("saveFailed"), tCommon("rateLimited")),
          type: "error",
        });
      });
    },
    [t, tCommon],
  );
}
