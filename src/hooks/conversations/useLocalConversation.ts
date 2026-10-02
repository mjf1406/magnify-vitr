import { useCallback, useRef, useState } from "react";
import { id } from "@instantdb/react";

import {
  normalizeMessageText,
  normalizeOtherName,
  type ChatMessage,
  type Sender,
} from "@/lib/conversation/message";

/** One unsaved conversation for someone who is not signed in. */
export function useLocalConversation() {
  const [otherName, setOtherNameState] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const setOtherName = useCallback((name: string) => {
    setOtherNameState(normalizeOtherName(name));
  }, []);

  const send = useCallback((text: string, sender: Sender) => {
    const normalized = normalizeMessageText(text);
    if (!normalized) return null;
    const message: ChatMessage = {
      id: id(),
      text: normalized,
      sender,
      createdAt: Date.now(),
    };
    setMessages((current) => [...current, message]);
    return message.id;
  }, []);

  const edit = useCallback((messageId: string, text: string) => {
    const normalized = normalizeMessageText(text);
    if (!normalized) return;
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, text: normalized } : message,
      ),
    );
  }, []);

  const remove = useCallback((messageId: string) => {
    const removed = messagesRef.current.find((message) => message.id === messageId) ?? null;
    setMessages((current) => current.filter((message) => message.id !== messageId));
    return removed;
  }, []);

  const restore = useCallback((message: ChatMessage) => {
    setMessages((current) =>
      [...current, message].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)),
    );
  }, []);

  const reset = useCallback(() => {
    setOtherNameState("");
    setMessages([]);
  }, []);

  return { otherName, setOtherName, messages, send, edit, remove, restore, reset };
}
