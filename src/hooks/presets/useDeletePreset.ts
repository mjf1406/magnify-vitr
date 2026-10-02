import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import type { Id } from "@/lib/ids";

type DeletePresetArgs = {
  id: Id<"presets">;
};

export function useDeletePreset() {
  const { t } = useTranslation("bigtext");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (args: DeletePresetArgs) => {
      void db.transact(db.tx.presets[args.id].delete()).catch((error: unknown) => {
        toast.add({
          title: messageFromError(error, t("deleteFailed"), tCommon("rateLimited")),
          type: "error",
        });
      });
    },
    [t, tCommon],
  );
}
