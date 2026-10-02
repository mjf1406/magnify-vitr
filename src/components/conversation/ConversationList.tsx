import { useState } from "react";
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SavedConversation } from "@/hooks/conversations/useConversations";
import { MAX_OTHER_NAME_LENGTH } from "@/lib/conversation/message";

type ConversationListProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: SavedConversation[];
  activeId: string | null;
  isPending: boolean;
  isError: boolean;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (conversation: SavedConversation) => void;
};

export function ConversationList(props: ConversationListProps) {
  const { t } = useTranslation("conversation");
  const isMobile = useIsMobile();
  const title = t("conversations");

  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ListBody {...props} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="right" className="w-3/4 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <ListBody {...props} />
      </SheetContent>
    </Sheet>
  );
}

function ListBody({
  conversations,
  activeId,
  isPending,
  isError,
  onOpenChange,
  onOpen,
  onCreate,
  onRename,
  onDelete,
}: ConversationListProps) {
  const { t } = useTranslation("conversation");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  function commitEdit(conversation: SavedConversation) {
    if (editingId !== conversation.id) return;
    const next = draftName.trim();
    setEditingId(null);
    if (next === conversation.otherName.trim()) return;
    onRename(conversation.id, next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Button
        type="button"
        onClick={() => {
          onOpenChange(false);
          onCreate();
        }}
      >
        <PlusIcon data-icon="inline-start" />
        {t("newConversation")}
      </Button>
      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>{t("loadFailed")}</AlertDescription>
        </Alert>
      ) : null}
      {isPending ? null : conversations.length === 0 ? (
        <Empty className="flex-none border p-4">
          <EmptyHeader>
            <EmptyDescription>{t("emptyList")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1">
          {conversations.map((conversation) => {
            const editing = editingId === conversation.id;
            const label = conversation.otherName.trim() || t("them");
            return (
              <li key={conversation.id} className="flex items-center gap-1">
                {editing ? (
                  <Input
                    value={draftName}
                    maxLength={MAX_OTHER_NAME_LENGTH}
                    aria-label={t("renameOther")}
                    className="min-w-0 flex-1"
                    autoFocus
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitEdit(conversation);
                      if (event.key === "Escape") setEditingId(null);
                    }}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant={conversation.id === activeId ? "secondary" : "ghost"}
                    className="min-w-0 flex-1 justify-start"
                    onClick={() => {
                      onOpenChange(false);
                      onOpen(conversation.id);
                    }}
                  >
                    <span className="truncate">{label}</span>
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={editing ? t("save") : t("renameOther")}
                  onClick={() => {
                    if (editing) commitEdit(conversation);
                    else {
                      setEditingId(conversation.id);
                      setDraftName(conversation.otherName);
                    }
                  }}
                >
                  {editing ? <CheckIcon /> : <PencilIcon />}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  aria-label={t("deleteConversation")}
                  onClick={() => onDelete(conversation)}
                >
                  <Trash2Icon />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
