import { useCallback } from "react";

import { db } from "@/lib/instant/db";
import type { PresetStyle, RichDoc } from "@/lib/bigtext/types";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

export type RestorePresetArgs = {
  id: Id<"presets">;
  name: string;
  doc: RichDoc;
  style: PresetStyle;
  createdAt: number;
  updatedAt: number;
};

/** Put a deleted preset back. The undo toast reports failure. */
export function useRestorePreset() {
  const { user } = db.useAuth();

  return useCallback(
    (args: RestorePresetArgs) => {
      if (!user || !isAllowedEmail(user.email)) {
        return Promise.reject(new Error("Not signed in"));
      }
      return db
        .transact(
          db.tx.presets[args.id]
            .update({
              name: args.name,
              doc: args.doc,
              style: args.style,
              createdAt: args.createdAt,
              updatedAt: args.updatedAt,
            })
            .link({ owner: user.id }),
        )
        .then(() => undefined);
    },
    [user],
  );
}
