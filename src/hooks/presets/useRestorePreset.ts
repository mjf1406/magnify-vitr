import { useAsyncAction } from "@/hooks/useAsyncAction";
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

  return useAsyncAction(async (args: RestorePresetArgs) => {
    if (!user || !isAllowedEmail(user.email)) {
      throw new Error("Not signed in");
    }
    await db.transact(
      db.tx.presets[args.id]
        .update({
          name: args.name,
          doc: args.doc,
          style: args.style,
          createdAt: args.createdAt,
          updatedAt: args.updatedAt,
        })
        .link({ owner: user.id }),
    );
  });
}
