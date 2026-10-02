import { CloudOff, CloudUpload } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("connectionOffline")}
              className="animate-pulse text-destructive"
            />
          }
        >
          <CloudOff />
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
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("connectionSyncing")}
              className="animate-pulse"
            />
          }
        >
          <CloudUpload />
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
