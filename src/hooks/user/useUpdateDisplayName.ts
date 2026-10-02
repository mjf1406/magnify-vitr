import { useTranslation } from "react-i18next";

import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { toast } from "@/components/ui/toast-manager";
import { db } from "@/lib/instant/db";
import { fullNameFromParts } from "@/lib/user/userName";

type UpdateDisplayNameArgs = {
  firstName: string;
  lastName: string;
};

export function useUpdateDisplayName() {
  const { t } = useTranslation("account");
  const { data: user } = useCurrentUser();

  return useAsyncAction(
    async (args: UpdateDisplayNameArgs) => {
      if (!user?.profileId) {
        throw new Error(t("profileSaveFailed"));
      }
      await db.transact(
        db.tx.profiles[user.profileId].update({
          name: fullNameFromParts(args.firstName, args.lastName),
        }),
      );
    },
    {
      onError: (error) => {
        toast.add({
          type: "error",
          title: error instanceof Error ? error.message : t("profileSaveFailed"),
        });
      },
    },
  );
}
