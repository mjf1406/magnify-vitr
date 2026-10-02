import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Pencil, Trash2 } from "lucide-react";

import { FileDropzone } from "@/components/upload/FileDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useDeleteFile } from "@/hooks/files/useDeleteFile";
import { useRenameFile } from "@/hooks/files/useRenameFile";
import { useUserFiles, type UserFilePublic } from "@/hooks/files/useUserFiles";
import { PUBLIC_READ } from "../../../instant.perms";
import type { FileVisibility } from "../../../shared/access";

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function FileRow({ file }: { file: UserFilePublic }) {
  const { t } = useTranslation("files");
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const [name, setName] = useState(file.name);

  return (
    <Item variant="outline">
      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full">{file.name}</ItemTitle>
        <ItemDescription>
          {formatBytes(file.size)} · {file.contentType} ·{" "}
          {t(`visibility${file.visibility === "public" ? "Public" : "Private"}`)}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="flex-wrap">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-40"
          aria-label={t("nameLabel")}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={renameFile.isPending || name.trim() === file.name}
          onClick={() => {
            void renameFile.mutateAsync({ fileId: file._id, name });
          }}
        >
          <Pencil data-icon="inline-start" />
          {t("rename")}
        </Button>
        {file.url ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            nativeButton={false}
            render={
              <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.name} />
            }
          >
            <Download data-icon="inline-start" />
            {t("download")}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={deleteFile.isPending}
          onClick={() => {
            void deleteFile.mutateAsync({ fileId: file._id, storageId: file.fileId });
          }}
        >
          <Trash2 data-icon="inline-start" />
          {t("delete")}
        </Button>
      </ItemActions>
    </Item>
  );
}

export function FilesPage() {
  const { t } = useTranslation("files");
  const { data: files, isPending } = useUserFiles();
  const [visibility, setVisibility] = useState<FileVisibility>("private");
  const sorted = useMemo(() => [...files].sort((a, b) => b.createdAt - a.createdAt), [files]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("uploadTitle")}</CardTitle>
          <CardDescription>{t("uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {PUBLIC_READ ? (
            <Field className="flex-row items-center justify-between gap-4">
              <FieldLabel htmlFor="file-visibility">{t("visibilityPublic")}</FieldLabel>
              <Switch
                id="file-visibility"
                checked={visibility === "public"}
                onCheckedChange={(checked) => setVisibility(checked ? "public" : "private")}
              />
            </Field>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {visibility === "public" ? t("visibilityHintPublic") : t("visibilityHintPrivate")}
          </p>
          <FileDropzone presetKey="images" visibility={visibility} />
        </CardContent>
      </Card>

      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : sorted.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup>
          {sorted.map((file) => (
            <FileRow key={file._id} file={file} />
          ))}
        </ItemGroup>
      )}
    </div>
  );
}
