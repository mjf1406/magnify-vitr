import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { db } from "@/lib/instant/db";
import {
  getUnsyncedMutationCount,
  subscribePendingMutations,
} from "@/lib/instant/pendingMutations";

export type ConnectionStatus = "connected" | "connecting" | "reconnecting" | "offline" | "syncing";

const DISCONNECTED_DEBOUNCE_MS = 2000;
const MIN_SYNCING_MS = 800;

export function useConnectionStatus() {
  const raw = db.useConnectionStatus();
  const unsyncedCount = useSyncExternalStore(
    subscribePendingMutations,
    getUnsyncedMutationCount,
    () => 0,
  );
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const hasEverConnectedRef = useRef(false);
  const hadOutageRef = useRef(false);
  const disconnectTimerRef = useRef<number | null>(null);
  const syncingStartedAtRef = useRef<number | null>(null);
  const minSyncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (disconnectTimerRef.current !== null) {
      window.clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }

    const connected = raw === "authenticated" || raw === "opened";
    if (connected) {
      hasEverConnectedRef.current = true;
      if (hadOutageRef.current) {
        if (syncingStartedAtRef.current === null) {
          syncingStartedAtRef.current = Date.now();
        }
        setStatus("syncing");
      } else {
        setStatus("connected");
      }
      return;
    }

    if (minSyncTimerRef.current !== null) {
      window.clearTimeout(minSyncTimerRef.current);
      minSyncTimerRef.current = null;
    }
    syncingStartedAtRef.current = null;
    setStatus(hasEverConnectedRef.current ? "reconnecting" : "connecting");
    disconnectTimerRef.current = window.setTimeout(() => {
      hadOutageRef.current = true;
      setStatus("offline");
      disconnectTimerRef.current = null;
    }, DISCONNECTED_DEBOUNCE_MS);

    return () => {
      if (disconnectTimerRef.current !== null) {
        window.clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    };
  }, [raw]);

  useEffect(() => {
    if (status !== "syncing") return;

    if (unsyncedCount > 0) {
      if (minSyncTimerRef.current !== null) {
        window.clearTimeout(minSyncTimerRef.current);
        minSyncTimerRef.current = null;
      }
      return;
    }

    const startedAt = syncingStartedAtRef.current ?? Date.now();
    const remaining = MIN_SYNCING_MS - (Date.now() - startedAt);

    const finish = () => {
      hadOutageRef.current = false;
      syncingStartedAtRef.current = null;
      minSyncTimerRef.current = null;
      setStatus("connected");
    };

    if (remaining <= 0) {
      finish();
      return;
    }

    minSyncTimerRef.current = window.setTimeout(finish, remaining);

    return () => {
      if (minSyncTimerRef.current !== null) {
        window.clearTimeout(minSyncTimerRef.current);
        minSyncTimerRef.current = null;
      }
    };
  }, [status, unsyncedCount]);

  return useMemo(
    () => ({
      status,
      connectionState: { status: raw },
    }),
    [status, raw],
  );
}
