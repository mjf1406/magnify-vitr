import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MAX_OTHER_NAME_LENGTH } from "@/lib/conversation/message";

type OtherNameChipProps = {
  name: string;
  fallback: string;
  onSave: (name: string) => void;
};

export function OtherNameChip({ name, fallback, onSave }: OtherNameChipProps) {
  const { t } = useTranslation("conversation");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const label = name.trim() || fallback;

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next === name.trim()) return;
    onSave(next);
  }

  if (editing) {
    return (
      <Input
        value={draft}
        maxLength={MAX_OTHER_NAME_LENGTH}
        aria-label={t("renameOther")}
        className="h-8 max-w-48"
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            setDraft(name);
            setEditing(false);
          }
        }}
        onFocus={(event) => event.currentTarget.select()}
      />
    );
  }

  return (
    <Badge
      variant="secondary"
      render={<button type="button" />}
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
    >
      {label}
    </Badge>
  );
}
