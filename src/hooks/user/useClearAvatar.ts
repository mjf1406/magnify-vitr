import { useTranslation } from "react-i18next";

import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { toast } from "@/components/ui/toast-manager";
import { messageFromError } from "@/lib/errors/convexError";
import { db } from "@/lib/instant/db";

export function useClearAvatar() {
  const { t } = useTranslation("account");
  const { t: tCommon } = useTranslation("common");
  const { data: user } = useCurrentUser();

  return useAsyncAction(
    async (_args: Record<string, never>) => {
      if (!user?.profileId || !user.avatarFileId) {
        return;
      }
      await db.transact(db.tx.profiles[user.profileId].unlink({ avatar: user.avatarFileId }));
    },
    {
      onError: (error) => {
        toast.add({
          type: "error",
          title: messageFromError(error, t("avatarClearFailed"), tCommon("rateLimited")),
        });
      },
    },
  );
}
