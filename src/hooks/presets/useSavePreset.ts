import { useCallback } from "react";
import { id } from "@instantdb/react";
import { useTranslation } from "react-i18next";

import { toast } from "@/components/ui/toast-manager";
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

  return useCallback(
    (args: SavePresetArgs) => {
      if (!user || !isAllowedEmail(user.email)) {
        const error = new Error(t("signInToSave"));
        toast.add({ title: error.message, type: "error" });
        throw error;
      }
      const name = args.name.trim();
      if (!name) {
        const error = new Error(t("nameRequired"));
        toast.add({ title: error.message, type: "error" });
        throw error;
      }
      const now = Date.now();
      const presetId = args.id ?? id();
      const base = {
        name,
        doc: args.doc,
        style: args.style,
        updatedAt: now,
      };
      const tx = args.id
        ? db.tx.presets[presetId].update(base)
        : db.tx.presets[presetId].update({ ...base, createdAt: now }).link({ owner: user.id });

      void db.transact(tx).catch((error: unknown) => {
        toast.add({
          title: messageFromError(error, t("saveFailed"), tCommon("rateLimited")),
          type: "error",
        });
      });

      return presetId;
    },
    [t, tCommon, user],
  );
}
