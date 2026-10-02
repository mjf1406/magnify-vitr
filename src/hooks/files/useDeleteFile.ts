import { useTranslation } from "react-i18next";

import { db } from "@/lib/instant/db";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { toast } from "@/components/ui/toast-manager";
import { messageFromError } from "@/lib/errors/convexError";
import type { Id } from "@/lib/ids";

type DeleteFileArgs = {
  fileId: Id<"fileRecords">;
  storageId?: Id<"files">;
};

export function useDeleteFile() {
  const { t } = useTranslation("upload");
  const { t: tCommon } = useTranslation("common");
  return useAsyncAction(
    async (args: DeleteFileArgs) => {
      await db.transact([
        db.tx.fileRecords[args.fileId].delete(),
        ...(args.storageId ? [db.tx.$files[args.storageId].delete()] : []),
      ]);
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
