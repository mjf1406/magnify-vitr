import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import type { Id } from "@/lib/ids";

type DeletePresetArgs = {
  id: Id<"presets">;
};

export function useDeletePreset() {
  const { t } = useTranslation("bigtext");
  const { t: tCommon } = useTranslation("common");

  return useAsyncAction(
    async (args: DeletePresetArgs) => {
      await db.transact(db.tx.presets[args.id].delete());
    },
    {
      onError: (error) => {
        toast.add({
          title: messageFromError(error, t("deleteFailed"), tCommon("rateLimited")),
          type: "error",
        });
      },
    },
  );
}
