import { useTranslation } from "react-i18next";

import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { toast } from "@/components/ui/toast-manager";
import { messageFromError } from "@/lib/errors/convexError";
import { db } from "@/lib/instant/db";
import type { Id } from "@/lib/ids";

type UpdateAvatarArgs = {
  fileId: Id<"files">;
};

export function useUpdateAvatar() {
  const { t } = useTranslation("account");
  const { t: tCommon } = useTranslation("common");
  const { data: user } = useCurrentUser();

  return useAsyncAction(
    async (args: UpdateAvatarArgs) => {
      if (!user?.profileId) {
        throw new Error(t("avatarSaveFailed"));
      }
      await db.transact(db.tx.profiles[user.profileId].link({ avatar: args.fileId }));
    },
    {
      onError: (error) => {
        toast.add({
          type: "error",
          title: messageFromError(error, t("avatarSaveFailed"), tCommon("rateLimited")),
        });
      },
    },
  );
}
