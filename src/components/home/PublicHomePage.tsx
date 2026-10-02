import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LogoBig } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserFiles } from "@/hooks/files/useUserFiles";
import { db } from "@/lib/instant/db";
import { PUBLIC_READ } from "../../../instant.perms";

export function PublicHomePage() {
  const { t } = useTranslation("home");
  const { t: tCommon } = useTranslation("common");
  const { user } = db.useAuth();
  const { data: files, isPending } = useUserFiles({ publicOnly: true });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-4 py-12 text-center">
      <LogoBig />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      {user ? (
        <Button nativeButton={false} render={<Link to="/files" />}>
          {t("manageFiles")}
        </Button>
      ) : (
        <Button nativeButton={false} render={<Link to="/login" />}>
          {tCommon("signIn")}
        </Button>
      )}

      {PUBLIC_READ ? (
        <section className="w-full text-left">
          <h2 className="text-lg font-medium">{t("publicFilesTitle")}</h2>
          {isPending ? (
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : files.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("publicFilesEmpty")}</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {files.map((file) => (
                <li key={file._id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{file.name}</p>
                  {file.url ? (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      {t("openFile")}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
