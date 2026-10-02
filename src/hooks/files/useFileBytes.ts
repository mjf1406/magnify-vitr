import { db } from "@/lib/instant/db";
import { first } from "@/lib/instant/first";
import type { Id } from "@/lib/ids";

type FileBytesResult = {
  blob: Blob | null;
  contentType: string;
  name: string;
};

export function useFileBytes(fileId: Id<"files"> | undefined) {
  const query = db.useQuery(
    fileId
      ? {
          $files: { $: { where: { id: fileId } } },
          fileRecords: { $: { where: { "file.id": fileId } }, file: {} },
        }
      : null,
  );

  const file = query.data?.$files[0] ?? first(query.data?.fileRecords[0]?.file);
  const url = file?.url ?? null;

  return {
    data: file
      ? ({
          blob: null,
          contentType: "application/octet-stream",
          name: file.path ?? "file",
        } satisfies FileBytesResult)
      : undefined,
    url,
    isPending: query.isLoading,
    isAuthLoading: false,
    isError: Boolean(query.error),
    error: query.error,
    isSuccess: Boolean(url),
    refetch: () => undefined,
    status: query.isLoading ? "pending" : url ? "success" : "error",
  };
}

export const useFileUrl = useFileBytes;

export function removeAllFileBytesQueries(_queryClient?: unknown) {
  return;
}

export function useRemoveFileBytesOnAccessLoss(_lost: boolean) {
  return;
}
