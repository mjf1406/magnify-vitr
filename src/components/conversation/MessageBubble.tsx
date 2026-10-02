import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@/components/ui/action-menu";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Message, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import { Textarea } from "@/components/ui/textarea";
import { formatLocalizedDateTime } from "@/i18n/formatDate";
import { MAX_MESSAGE_LENGTH, type ChatMessage, type Sender } from "@/lib/conversation/message";
import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  message: ChatMessage;
  label: string;
  showLabel: boolean;
  onEdit: (id: string, text: string) => void;
  onDelete: (message: ChatMessage) => void;
};

export function MessageBubble({ message, label, showLabel, onEdit, onDelete }: MessageBubbleProps) {
  const { t } = useTranslation("conversation");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const align = message.sender === ("me" satisfies Sender) ? "end" : "start";
  const variant = message.sender === "me" ? "default" : "muted";

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === message.text) return;
    onEdit(message.id, next);
  }

  const messageActions = [
    {
      id: "edit",
      label: t("editMessage"),
      icon: <PencilIcon />,
      onSelect: () => {
        setDraft(message.text);
        setEditing(true);
      },
    },
    {
      id: "delete",
      label: t("deleteMessage"),
      icon: <Trash2Icon />,
      variant: "destructive" as const,
      onSelect: () => onDelete(message),
    },
  ];

  return (
    <Message align={align}>
      <MessageContent>
        {showLabel ? <MessageHeader>{label}</MessageHeader> : null}
        {editing ? (
          <Bubble variant={variant} align={align}>
            <BubbleContent>
              <Textarea
                value={draft}
                maxLength={MAX_MESSAGE_LENGTH}
                rows={2}
                aria-label={t("editMessage")}
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setDraft(message.text);
                    setEditing(false);
                  }
                }}
              />
            </BubbleContent>
            <div className="flex items-center gap-1">
              <Button type="button" size="sm" onClick={commit}>
                {t("save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(message.text);
                  setEditing(false);
                }}
              >
                {t("cancel")}
              </Button>
            </div>
          </Bubble>
        ) : (
          <Bubble variant={variant} align={align}>
            <BubbleContent
              className={cn("flex items-center gap-1", align === "end" ? "pe-1.5" : "ps-1.5")}
            >
              {align === "start" ? (
                <ActionMenu
                  label={t("messageActions")}
                  align="start"
                  className="size-6 shrink-0 text-current hover:bg-current/15 hover:text-current aria-expanded:bg-current/15 aria-expanded:text-current"
                  items={messageActions}
                />
              ) : null}
              <span className="min-w-0 whitespace-pre-wrap">{message.text}</span>
              {align === "end" ? (
                <ActionMenu
                  label={t("messageActions")}
                  align="end"
                  className="size-6 shrink-0 text-current hover:bg-current/15 hover:text-current aria-expanded:bg-current/15 aria-expanded:text-current"
                  items={messageActions}
                />
              ) : null}
            </BubbleContent>
          </Bubble>
        )}
        <MessageFooter>
          <time dateTime={new Date(message.createdAt).toISOString()}>
            {formatLocalizedDateTime(message.createdAt)}
          </time>
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}
