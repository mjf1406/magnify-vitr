import { useMemo } from "react";

import { PUBLIC_READ } from "../../../instant.perms";
import { db } from "@/lib/instant/db";
import { first } from "@/lib/instant/first";
import type { Id } from "@/lib/ids";
import type { FileVisibility } from "../../../shared/access";

export type UserFilePublic = {
  _id: Id<"fileRecords">;
  name: string;
  contentType: string;
  size: number;
  createdAt: number;
  visibility: FileVisibility;
  url?: string;
  fileId?: Id<"files">;
};

export function useUserFiles(options?: { publicOnly?: boolean }) {
  const { user, isLoading: isAuthLoading } = db.useAuth();
  const publicOnly = options?.publicOnly === true;
  const canQuery = publicOnly ? PUBLIC_READ : Boolean(user);

  const query = db.useQuery({
    fileRecords: {
      file: {},
    },
  });

  const data = useMemo<Array<UserFilePublic>>(() => {
    if (!canQuery) return [];
    return (query.data?.fileRecords ?? [])
      .filter((record) => !publicOnly || record.visibility === "public")
      .map((record) => {
        const file = first(record.file);
        return {
          _id: record.id,
          name: record.name,
          contentType: record.contentType,
          size: record.size,
          createdAt: record.createdAt as number,
          visibility: record.visibility === "public" ? "public" : "private",
          url: file?.url,
          fileId: file?.id,
        };
      });
  }, [canQuery, publicOnly, query.data]);

  const isPending = (!publicOnly && isAuthLoading) || query.isLoading;
  return {
    data,
    isPending,
    isLoading: isPending,
    isError: Boolean(query.error),
    error: query.error,
  };
}
