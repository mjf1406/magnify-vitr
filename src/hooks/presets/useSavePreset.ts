import { id } from "@instantdb/react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { db } from "@/lib/instant/db";
import { messageFromError } from "@/lib/errors/convexError";
import type { PresetStyle, RichDoc } from "@/lib/bigtext/types";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

export type SavePresetArgs = {
  id?: Id<"presets">;
  name: string;
  doc: RichDoc;
  style: PresetStyle;
};

export function useSavePreset() {
  const { user } = db.useAuth();
  const { t } = useTranslation("bigtext");
  const { t: tCommon } = useTranslation("common");

  return useAsyncAction(
    async (args: SavePresetArgs) => {
      if (!user || !isAllowedEmail(user.email)) {
        throw new Error(t("signInToSave"));
      }
      const name = args.name.trim();
      if (!name) throw new Error(t("nameRequired"));
      const now = Date.now();
      const presetId = args.id ?? id();
      const base = {
        name,
        doc: args.doc,
        style: args.style,
        updatedAt: now,
      };
      if (args.id) {
        await db.transact(db.tx.presets[presetId].update(base));
      } else {
        await db.transact(
          db.tx.presets[presetId].update({ ...base, createdAt: now }).link({ owner: user.id }),
        );
      }
      return presetId;
    },
    {
      onError: (error) => {
        toast.add({
          title: messageFromError(error, t("saveFailed"), tCommon("rateLimited")),
          type: "error",
        });
      },
    },
  );
}
