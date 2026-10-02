import { useMemo } from "react";

import { db } from "@/lib/instant/db";
import { first } from "@/lib/instant/first";
import { sanitizeAvatarUrl } from "../../../shared/avatarUrl";
import type { AppLanguage } from "@/lib/languages";
import type { Id } from "@/lib/ids";

export type CurrentUser = {
  _id: string;
  profileId?: Id<"profiles">;
  email?: string;
  name?: string;
  image?: string | null;
  avatarFileId?: Id<"files"> | null;
  settings: { language: AppLanguage } | null;
  providers: Array<string>;
};

export function useCurrentUser() {
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const query = db.useQuery(
    user
      ? {
          profiles: { $: { where: { "$user.id": user.id } }, avatar: {} },
        }
      : null,
  );

  const data = useMemo<CurrentUser | null>(() => {
    if (!user) return null;
    const profile = query.data?.profiles[0];
    const avatar = profile ? first(profile.avatar) : null;
    return {
      _id: user.id,
      profileId: profile?.id,
      email: user.email ?? undefined,
      name: profile?.name ?? undefined,
      image: sanitizeAvatarUrl(avatar?.url) ?? null,
      avatarFileId: avatar?.id ?? null,
      settings: profile ? { language: profile.language as AppLanguage } : { language: "en" },
      providers: ["google"],
    };
  }, [query.data, user]);

  const isPending = isAuthLoading || query.isLoading;
  return {
    data,
    isPending,
    isLoading: isPending,
    isError: Boolean(query.error),
    error: query.error ?? null,
    isAuthLoading,
  };
}
