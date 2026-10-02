import { asMillis } from "@/hooks/presets/presetTime";
import { isSender, type ChatMessage } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";

type MessageRow = {
  id: string;
  text: unknown;
  sender: unknown;
  createdAt: unknown;
};

export type SavedConversation = {
  id: Id<"conversations">;
  otherName: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export function mapMessages(rows: ReadonlyArray<MessageRow> | null | undefined): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (const row of rows ?? []) {
    if (!isSender(row.sender) || typeof row.text !== "string") continue;
    messages.push({
      id: row.id,
      text: row.text,
      sender: row.sender,
      createdAt: asMillis(row.createdAt),
    });
  }
  messages.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return messages;
}

export function mapConversation(row: {
  id: string;
  otherName: unknown;
  createdAt: unknown;
  updatedAt: unknown;
  messages?: ReadonlyArray<MessageRow> | null;
}): SavedConversation | null {
  if (typeof row.otherName !== "string") return null;
  return {
    id: row.id,
    otherName: row.otherName,
    createdAt: asMillis(row.createdAt),
    updatedAt: asMillis(row.updatedAt),
    messages: mapMessages(row.messages),
  };
}
