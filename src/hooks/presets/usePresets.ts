import { useMemo } from "react";

import { db } from "@/lib/instant/db";
import {
  richDocSchema,
  presetStyleSchema,
  type PresetStyle,
  type RichDoc,
} from "@/lib/bigtext/types";
import type { Id } from "@/lib/ids";
import { isAllowedEmail } from "../../../shared/access";

import { asMillis } from "./presetTime";

export type SavedPreset = {
  id: Id<"presets">;
  name: string;
  doc: RichDoc;
  style: PresetStyle;
  createdAt: number;
  updatedAt: number;
};

export function usePresets() {
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const canQuery = Boolean(user && isAllowedEmail(user.email));

  const query = db.useQuery(
    canQuery && user
      ? {
          presets: {
            $: {
              where: { "owner.id": user.id },
              order: { updatedAt: "desc" },
            },
          },
        }
      : null,
  );

  const data = useMemo<SavedPreset[]>(() => {
    if (!canQuery) return [];
    const presets: SavedPreset[] = [];
    for (const row of query.data?.presets ?? []) {
      const doc = richDocSchema.safeParse(row.doc);
      const style = presetStyleSchema.safeParse(row.style);
      if (!doc.success || !style.success || typeof row.name !== "string") continue;
      presets.push({
        id: row.id,
        name: row.name,
        doc: doc.data,
        style: style.data,
        createdAt: asMillis(row.createdAt),
        updatedAt: asMillis(row.updatedAt),
      });
    }
    return presets;
  }, [canQuery, query.data]);

  const isPending = isAuthLoading || (canQuery && query.isLoading);
  return {
    data,
    isPending,
    isError: Boolean(query.error),
    error: query.error,
  };
}
