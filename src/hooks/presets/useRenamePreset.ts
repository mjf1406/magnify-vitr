import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { useAsyncAction } from "@/hooks/useAsyncAction";
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

  return useAsyncAction(
    async (args: RenamePresetArgs) => {
      const name = args.name.trim();
      if (!name) throw new Error(t("nameRequired"));
      await db.transact(
        db.tx.presets[args.id].update({
          name,
          updatedAt: Date.now(),
        }),
      );
    },
    {
      onError: (error) => {
        toast.add({
          title: messageFromError(error, t("renameFailed"), tCommon("rateLimited")),
          type: "error",
        });
      },
    },
  );
}
