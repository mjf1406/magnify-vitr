export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_OTHER_NAME_LENGTH = 40;

export type Sender = "me" | "them";

export type ChatMessage = {
  id: string;
  text: string;
  sender: Sender;
  createdAt: number;
};

export function isSender(value: unknown): value is Sender {
  return value === "me" || value === "them";
}

export function otherSpeaker(speaker: Sender): Sender {
  return speaker === "me" ? "them" : "me";
}

/** Trimmed plain text, capped so a message stays a short note. */
export function normalizeMessageText(value: string): string {
  return value.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function normalizeOtherName(value: string): string {
  return value.trim().slice(0, MAX_OTHER_NAME_LENGTH);
}
