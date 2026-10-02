import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Pencil, Save, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

function PresetDeleteButton({
  preset,
  onDelete,
}: {
  preset: SavedPreset;
  onDelete: (preset: SavedPreset) => void;
}) {
  const { t } = useTranslation("bigtext");
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            aria-label={`${t("delete")} ${preset.name}`}
          />
        }
      >
        <Trash2 />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmDescription", { name: preset.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            onClick={() => {
              setOpen(false);
              onDelete(preset);
            }}
          >
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  function saveCurrent() {
    const existingId = activeIdRef.current;
    try {
      const savedId = save({
        id: existingId ?? undefined,
        name,
        doc,
        style,
      });
      if (existingId) onSaved(savedId, name.trim());
      else onNameChange("");
    } catch {
      // The save hook already shows an error toast.
    }
  }

  function startEdit(preset: SavedPreset) {
    setEditingId(preset.id);
    setDraftName(preset.name);
  }

  function commitEdit(preset: SavedPreset) {
    if (editingId !== preset.id) return;
    const next = draftName.trim();
    if (!next || next === preset.name) {
      setEditingId(null);
      return;
    }
    try {
      rename({ id: preset.id, name: next });
    } catch {
      return;
    }
    if (activeId === preset.id) onSaved(preset.id, next);
    setEditingId(null);
  }

  function deletePreset(preset: SavedPreset) {
    remove({ id: preset.id });
    if (editingId === preset.id) setEditingId(null);
    if (activeId === preset.id) onActiveCleared();
    undoToast({
      title: t("deleted"),
      onUndo: () => restore(preset),
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
        <div className="flex items-center gap-2">
          <Input
            id="preset-name"
            value={name}
            placeholder={t("presetNamePlaceholder")}
            maxLength={80}
            className="min-w-0 flex-1"
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              saveCurrent();
            }}
          />
          <Button type="button" size="icon" aria-label={t("save")} onClick={() => saveCurrent()}>
            <Save />
          </Button>
        </div>
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
          {presets.data.map((preset) => {
            const editing = editingId === preset.id;
            return (
              <li key={preset.id} className="flex items-center gap-1">
                {editing ? (
                  <Input
                    value={draftName}
                    maxLength={80}
                    className="min-w-0 flex-1"
                    aria-label={t("presetName")}
                    autoFocus
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitEdit(preset);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : (
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
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={editing ? t("rename") : `${t("editPreset")} ${preset.name}`}
                  onClick={() => {
                    if (editing) commitEdit(preset);
                    else startEdit(preset);
                  }}
                >
                  {editing ? <Check /> : <Pencil />}
                </Button>
                <PresetDeleteButton preset={preset} onDelete={deletePreset} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
