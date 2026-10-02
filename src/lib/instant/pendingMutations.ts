import { db } from "@/lib/instant/db";

type PendingMutation = { "tx-id"?: unknown };
type ReactorKv = {
  currentValue?: { pendingMutations?: Map<string, PendingMutation> };
  subscribe?: (cb: () => void) => () => void;
};

function getKv(): ReactorKv | undefined {
  const core = (db as unknown as { _core?: { _reactor?: { kv?: ReactorKv } } })._core;
  return core?._reactor?.kv;
}

export function subscribePendingMutations(cb: () => void): () => void {
  return getKv()?.subscribe?.(cb) ?? (() => {});
}

export function getUnsyncedMutationCount(): number {
  const pending = getKv()?.currentValue?.pendingMutations;
  if (!(pending instanceof Map)) return 0;
  let count = 0;
  for (const mut of pending.values()) if (!mut["tx-id"]) count++;
  return count;
}
