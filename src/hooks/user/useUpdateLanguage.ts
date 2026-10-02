import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { db } from "@/lib/instant/db";
import type { AppLanguage } from "@/lib/languages";

export function useUpdateLanguage() {
  const { data: user } = useCurrentUser();

  return useAsyncAction(async (args: { language: AppLanguage }) => {
    if (!user?.profileId) {
      return;
    }
    await db.transact(db.tx.profiles[user.profileId].update({ language: args.language }));
  });
}
