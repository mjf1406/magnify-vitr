import { useTranslation } from "react-i18next";
import { InfoIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePwaRegister } from "@/hooks/usePwaRegister";
import { cn } from "@/lib/utils";

export type PwaReloadBannerViewProps = {
  onReload: () => void;
  onLater: () => void;
  className?: string;
};

/**
 * Presentational PWA update banner (layout + copy).
 * Used by the live banner and the /ui playground.
 */
export function PwaReloadBannerView({ onReload, onLater, className }: PwaReloadBannerViewProps) {
  const { t } = useTranslation("common");

  return (
    <Alert
      aria-live="assertive"
      className={cn(
        "flex flex-col items-start gap-3 rounded-none border-x-0 border-t-0 pr-4! sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <InfoIcon aria-hidden="true" />
      <div className="min-w-0">
        <AlertTitle>{t("pwaUpdateTitle")}</AlertTitle>
        <AlertDescription>{t("pwaUpdateDescription")}</AlertDescription>
      </div>
      <AlertAction className="static flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button type="button" size="sm" className="w-full sm:w-auto" onClick={onReload}>
          {t("pwaUpdateReload")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onLater}
        >
          {t("pwaUpdateLater")}
        </Button>
      </AlertAction>
    </Alert>
  );
}

function PwaReloadBannerLive() {
  const { needRefresh, dismiss, reload } = usePwaRegister();

  if (!needRefresh) {
    return null;
  }

  return (
    <PwaReloadBannerView
      className="fixed inset-x-0 top-0 z-[100] pt-[max(0.75rem,env(safe-area-inset-top))]"
      onReload={reload}
      onLater={dismiss}
    />
  );
}

/**
 * Root-mounted PWA chrome.
 * Dev builds do not register a SW (vite-plugin-pwa stub when devOptions.enabled is false).
 */
export function PwaRoot() {
  if (!import.meta.env.PROD) {
    return null;
  }
  return <PwaReloadBannerLive />;
}
