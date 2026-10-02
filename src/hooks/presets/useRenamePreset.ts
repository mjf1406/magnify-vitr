import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import type { Id } from "@/lib/ids";

type RenamePresetArgs = {
  id: Id<"presets">;
  name: string;
};

export function useRenamePreset() {
  const { t } = useTranslation("bigtext");
  const { t: tCommon } = useTranslation("common");

  return useCallback(
    (args: RenamePresetArgs) => {
      const name = args.name.trim();
      if (!name) {
        const error = new Error(t("nameRequired"));
        toast.add({ title: error.message, type: "error" });
        throw error;
      }
      void db
        .transact(
          db.tx.presets[args.id].update({
            name,
            updatedAt: Date.now(),
          }),
        )
        .catch((error: unknown) => {
          toast.add({
            title: messageFromError(error, t("renameFailed"), tCommon("rateLimited")),
            type: "error",
          });
        });
    },
    [t, tCommon],
  );
}
