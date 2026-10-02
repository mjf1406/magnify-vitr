import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import type { Id } from "@/lib/ids";

type DeleteMessageArgs = {
  id: Id<"messages">;
};

export function useDeleteMessage() {
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (args: DeleteMessageArgs) => {
      void db.transact(db.tx.messages[args.id].delete()).catch((error: unknown) => {
        toast.add({
          title: messageFromError(error, t("deleteFailed"), tCommon("rateLimited")),
          type: "error",
        });
      });
    },
    [t, tCommon],
  );
}
