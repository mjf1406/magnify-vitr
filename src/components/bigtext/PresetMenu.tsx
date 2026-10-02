import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { undoToast } from "@/components/ui/undo-toast";
import { useDeletePreset } from "@/hooks/presets/useDeletePreset";
import { usePresets, type SavedPreset } from "@/hooks/presets/usePresets";
import { useRenamePreset } from "@/hooks/presets/useRenamePreset";
import { useRestorePreset } from "@/hooks/presets/useRestorePreset";
import { useSavePreset } from "@/hooks/presets/useSavePreset";
import { db } from "@/lib/instant/db";
import type { PresetStyle, RichDoc } from "@/lib/bigtext/types";
import { isAllowedEmail } from "../../../shared/access";

type PresetMenuProps = {
  doc: RichDoc;
  style: PresetStyle;
  activeId: string | null;
  name: string;
  onNameChange: (name: string) => void;
  onLoad: (preset: SavedPreset) => void;
  onSaved: (id: string, name: string) => void;
  onActiveCleared: () => void;
};

export function PresetMenu({
  doc,
  style,
  activeId,
  name,
  onNameChange,
  onLoad,
  onSaved,
  onActiveCleared,
}: PresetMenuProps) {
  const { t } = useTranslation("bigtext");
  const { user } = db.useAuth();
  const signedIn = Boolean(user && isAllowedEmail(user.email));
  const presets = usePresets();
  const save = useSavePreset();
  const rename = useRenamePreset();
  const remove = useDeletePreset();
  const restore = useRestorePreset();

  async function saveCurrent(asNew: boolean) {
    try {
      const savedId = await save.mutateAsync({
        id: asNew ? undefined : (activeId ?? undefined),
        name,
        doc,
        style,
      });
      onSaved(savedId, name.trim());
    } catch {
      // The save hook already shows an error toast.
    }
  }

  async function deletePreset(preset: SavedPreset) {
    try {
      await remove.mutateAsync({ id: preset.id });
    } catch {
      return;
    }
    if (activeId === preset.id) onActiveCleared();
    undoToast({
      title: t("deleted"),
      onUndo: () => restore.mutateAsync(preset),
    });
  }

  if (!signedIn) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{t("presetsTitle")}</h2>
        <Button nativeButton={false} render={<Link to="/login" search={{ redirect: "/" }} />}>
          {t("signInToSave")}
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{t("presetsTitle")}</h2>
      <div className="flex flex-col gap-1">
        <Label htmlFor="preset-name">{t("presetName")}</Label>
        <Input
          id="preset-name"
          value={name}
          placeholder={t("presetNamePlaceholder")}
          maxLength={80}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={save.isPending}
          onClick={() => void saveCurrent(false)}
        >
          {t("save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={save.isPending}
          onClick={() => void saveCurrent(true)}
        >
          {t("saveAs")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!activeId || rename.isPending}
          onClick={() => {
            if (!activeId) return;
            void rename.mutateAsync({ id: activeId, name }).then(
              () => onSaved(activeId, name.trim()),
              () => undefined,
            );
          }}
        >
          {t("rename")}
        </Button>
      </div>
      {presets.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t("loadFailed")}</AlertDescription>
        </Alert>
      ) : null}
      {presets.isPending ? null : presets.data.length === 0 ? (
        <Empty className="flex-none border p-4">
          <EmptyHeader>
            <EmptyDescription>{t("emptyPresets")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {presets.data.map((preset) => (
            <li key={preset.id} className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant={preset.id === activeId ? "secondary" : "ghost"}
                className="min-w-0 flex-1 justify-start"
                aria-label={`${t("load")} ${preset.name}`}
                onClick={() => onLoad(preset)}
              >
                <span className="truncate">{preset.name}</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={remove.isPending}
                onClick={() => void deletePreset(preset)}
              >
                {t("delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
