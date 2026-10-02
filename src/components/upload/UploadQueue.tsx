import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import type { UploadFileItem } from "@/hooks/files/useUploadFiles";

type UploadQueueProps = {
  items: readonly UploadFileItem[];
  onAbort: (id: string) => void;
  onRetry: (id: string) => void;
};

export function UploadQueue({ items, onAbort, onRetry }: UploadQueueProps) {
  const { t } = useTranslation("upload");

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const showAbort = item.status === "uploading";
        const showRetry = item.status === "error" || item.status === "aborted";

        return (
          <Item key={item.id} variant="outline" size="sm">
            <ItemContent className="min-w-0">
              <ItemTitle className="max-w-full">{item.file.name}</ItemTitle>
              <ItemDescription>
                {item.status === "queued" && t("queued")}
                {item.status === "uploading" && `${t("uploading")} (${item.progress}%)`}
                {item.status === "done" && t("uploaded")}
                {item.status === "aborted" && t("cancelled")}
                {item.status === "error" &&
                  (item.errorCode === "invalid_type"
                    ? t("invalidType")
                    : item.errorCode === "invalid_size"
                      ? t("invalidSize")
                      : item.errorCode === "invalid_content"
                        ? t("invalidContent")
                        : item.errorCode === "quota_exceeded"
                          ? t("quotaExceeded")
                          : item.errorCode === "finalize_failed"
                            ? t("finalizeFailed")
                            : t("uploadFailed"))}
              </ItemDescription>
            </ItemContent>
            {showAbort || showRetry ? (
              <ItemActions>
                {showAbort ? (
                  <Button variant="outline" size="sm" onClick={() => onAbort(item.id)}>
                    {t("abort")}
                  </Button>
                ) : null}
                {showRetry ? (
                  <Button variant="outline" size="sm" onClick={() => onRetry(item.id)}>
                    {t("retry")}
                  </Button>
                ) : null}
              </ItemActions>
            ) : null}
            {item.status === "uploading" ? (
              <ItemFooter>
                <Progress value={item.progress} className="w-full" />
              </ItemFooter>
            ) : null}
          </Item>
        );
      })}
    </div>
  );
}
