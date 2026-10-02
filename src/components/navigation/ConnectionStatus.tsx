import { CloudOff, CloudUpload } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";

export function ConnectionStatus() {
  const { t } = useTranslation("common");
  const { status } = useConnectionStatus();

  if (status === "offline") {
    return (
      <Popover>
        <PopoverTrigger
          aria-label={t("connectionOffline")}
          className="inline-flex size-9 animate-pulse items-center justify-center rounded-full bg-destructive/15 text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <CloudOff className="size-5" />
        </PopoverTrigger>
        <PopoverContent align="end">
          <PopoverHeader>
            <PopoverTitle>{t("connectionOffline")}</PopoverTitle>
            <PopoverDescription>{t("connectionOfflineDescription")}</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
  }

  if (status === "syncing") {
    return (
      <Popover>
        <PopoverTrigger
          aria-label={t("connectionSyncing")}
          className="inline-flex size-9 animate-pulse items-center justify-center rounded-full bg-amber-500/15 text-amber-600 outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-400"
        >
          <CloudUpload className="size-5" />
        </PopoverTrigger>
        <PopoverContent align="end">
          <PopoverHeader>
            <PopoverTitle>{t("connectionSyncing")}</PopoverTitle>
            <PopoverDescription>{t("connectionSyncingDescription")}</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
  }

  return null;
}
