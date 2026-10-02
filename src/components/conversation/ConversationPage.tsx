import { useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { MessagesSquareIcon, PlusIcon, TypeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Skeleton } from "@/components/ui/skeleton";
import { undoToast } from "@/components/ui/undo-toast";
import { useConversation } from "@/hooks/conversations/useConversation";
import { useConversations, type SavedConversation } from "@/hooks/conversations/useConversations";
import { useCreateConversation } from "@/hooks/conversations/useCreateConversation";
import { useDeleteConversation } from "@/hooks/conversations/useDeleteConversation";
import { useDeleteMessage } from "@/hooks/conversations/useDeleteMessage";
import { useEditMessage } from "@/hooks/conversations/useEditMessage";
import { useLocalConversation } from "@/hooks/conversations/useLocalConversation";
import { useRenameConversation } from "@/hooks/conversations/useRenameConversation";
import { useRestoreConversation } from "@/hooks/conversations/useRestoreConversation";
import { useRestoreMessage } from "@/hooks/conversations/useRestoreMessage";
import { useSendMessage } from "@/hooks/conversations/useSendMessage";
import { useCurrentUser } from "@/hooks/user/useCurrentUser";
import { useIsMobile } from "@/hooks/use-mobile";
import { db } from "@/lib/instant/db";
import { normalizeOtherName, type ChatMessage, type Sender } from "@/lib/conversation/message";
import type { Id } from "@/lib/ids";
import { cn } from "@/lib/utils";
import { isAllowedEmail } from "../../../shared/access";

import { Composer } from "./Composer";
import { ConversationList } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { OtherNameChip } from "./OtherNameChip";

const talkRoute = getRouteApi("/_public/talk");

function personLabel(name: string, fallback: string): string {
  return name.trim() || fallback;
}

type ConversationViewProps = {
  canSave: boolean;
  messages: ChatMessage[];
  otherName: string;
  meName: string;
  isPending: boolean;
  isMissing: boolean;
  isError: boolean;
  activeId: string | null;
  conversations: SavedConversation[];
  conversationsPending: boolean;
  conversationsError: boolean;
  speaker: Sender;
  onSpeakerChange: (speaker: Sender) => void;
  onOtherName: (name: string) => void;
  onSend: (text: string, sender: Sender) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (message: ChatMessage) => void;
  onRestore: (message: ChatMessage) => void | Promise<void>;
  onOpenConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, name: string) => void;
  onDeleteConversation: (conversation: SavedConversation) => void;
};

function ConversationView({
  canSave,
  messages,
  otherName,
  meName,
  isPending,
  isMissing,
  isError,
  activeId,
  conversations,
  conversationsPending,
  conversationsError,
  speaker,
  onSpeakerChange,
  onOtherName,
  onSend,
  onEdit,
  onDelete,
  onRestore,
  onOpenConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
}: ConversationViewProps) {
  const { t } = useTranslation("conversation");
  const { t: tCommon } = useTranslation("common");
  const isMobile = useIsMobile();
  const [listOpen, setListOpen] = useState(false);
  const meLabel = personLabel(meName, t("me"));
  const themLabel = personLabel(otherName, t("them"));
  const speakerName = speaker === "me" ? meLabel : themLabel;

  function deleteMessage(message: ChatMessage) {
    onDelete(message);
    undoToast({
      title: t("messageDeleted"),
      onUndo: () => onRestore(message),
    });
  }

  return (
    <div className={cn("flex min-h-0 flex-col", isMobile ? "h-svh" : "h-[calc(100svh-3.5rem)]")}>
      <header className="flex items-center gap-2 border-b border-border px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-2">
        <h1 className="sr-only">{t("title")}</h1>
        {isMobile ? (
          <Button
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            aria-label={t("backToBigText")}
            render={<Link to="/" />}
          >
            <TypeIcon />
          </Button>
        ) : null}
        <OtherNameChip name={otherName} fallback={t("them")} onSave={onOtherName} />
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("newConversation")}
            onClick={onNewConversation}
          >
            <PlusIcon />
          </Button>
          {canSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("conversations")}
              onClick={() => setListOpen(true)}
            >
              <MessagesSquareIcon />
            </Button>
          ) : null}
        </div>
      </header>
      {canSave ? null : (
        <Alert className="mx-3 mt-3">
          <AlertDescription>
            {t("signInToSave")}{" "}
            <Link to="/login" search={{ redirect: "/talk" }}>
              {tCommon("signIn")}
            </Link>
          </AlertDescription>
        </Alert>
      )}
      {isError ? (
        <Alert variant="destructive" className="mx-3 mt-3">
          <AlertDescription>{t("loadFailed")}</AlertDescription>
        </Alert>
      ) : null}
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller>
          <MessageScrollerViewport aria-label={t("title")}>
            <MessageScrollerContent className="justify-end gap-3 px-4 py-4">
              {isPending ? (
                <MessageScrollerItem messageId="pending">
                  <Skeleton className="h-16 w-2/3" />
                </MessageScrollerItem>
              ) : isMissing ? (
                <MessageScrollerItem messageId="missing">
                  <Empty>
                    <EmptyHeader>
                      <EmptyDescription>{t("missing")}</EmptyDescription>
                    </EmptyHeader>
                    <Button type="button" onClick={onNewConversation}>
                      {t("newConversation")}
                    </Button>
                  </Empty>
                </MessageScrollerItem>
              ) : messages.length === 0 ? (
                <MessageScrollerItem messageId="empty">
                  <Empty>
                    <EmptyHeader>
                      <EmptyDescription>{t("emptyConversation")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </MessageScrollerItem>
              ) : (
                messages.map((message, index) => {
                  const previous = messages[index - 1];
                  const showLabel = !previous || previous.sender !== message.sender;
                  const label = message.sender === "me" ? meLabel : themLabel;
                  return (
                    <MessageScrollerItem key={message.id} messageId={message.id}>
                      <MessageBubble
                        message={message}
                        label={label}
                        showLabel={showLabel}
                        onEdit={onEdit}
                        onDelete={deleteMessage}
                      />
                    </MessageScrollerItem>
                  );
                })
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton label={t("scrollToLatest")} />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Composer
          speaker={speaker}
          speakerName={speakerName}
          disabled={isMissing}
          onSpeakerChange={onSpeakerChange}
          onSend={(text, sender) => onSend(text, sender)}
        />
      </div>
      {canSave ? (
        <ConversationList
          open={listOpen}
          onOpenChange={setListOpen}
          conversations={conversations}
          activeId={activeId}
          isPending={conversationsPending}
          isError={conversationsError}
          onOpen={onOpenConversation}
          onCreate={onNewConversation}
          onRename={onRenameConversation}
          onDelete={onDeleteConversation}
        />
      ) : null}
    </div>
  );
}

function SavedTalk() {
  const { t } = useTranslation("conversation");
  const search = talkRoute.useSearch();
  const navigate = useNavigate();
  const conversationId = search.c ?? null;
  const conversation = useConversation(conversationId);
  const conversations = useConversations();
  const currentUser = useCurrentUser();
  const create = useCreateConversation();
  const rename = useRenameConversation();
  const removeConversation = useDeleteConversation();
  const restoreConversation = useRestoreConversation();
  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const restoreMessage = useRestoreMessage();
  const [speaker, setSpeaker] = useState<Sender>("me");

  function openConversation(id: string) {
    setSpeaker("me");
    void navigate({ to: "/talk", search: { c: id } });
  }

  function startNew() {
    setSpeaker("me");
    void navigate({ to: "/talk", search: {} });
  }

  function onOtherName(name: string) {
    if (conversationId) {
      rename({ id: conversationId, otherName: name });
      return;
    }
    if (!normalizeOtherName(name)) return;
    const createdId = create(name);
    if (!createdId) return;
    void navigate({ to: "/talk", search: { c: createdId } });
  }

  function onSend(text: string, sender: Sender) {
    const result = sendMessage({
      conversationId: conversationId ?? undefined,
      text,
      sender,
      otherName: conversation.data?.otherName ?? "",
    });
    if (!conversationId && result) {
      void navigate({ to: "/talk", search: { c: result.conversationId } });
    }
  }

  function onDeleteConversation(item: SavedConversation) {
    removeConversation({ id: item.id });
    if (item.id === conversationId) startNew();
    undoToast({
      title: t("conversationDeleted"),
      onUndo: () => restoreConversation(item),
    });
  }

  return (
    <ConversationView
      canSave
      messages={conversation.data?.messages ?? []}
      otherName={conversation.data?.otherName ?? ""}
      meName={currentUser.data?.name ?? ""}
      isPending={Boolean(conversationId) && conversation.isPending}
      isMissing={conversation.isMissing}
      isError={conversation.isError}
      activeId={conversationId}
      conversations={conversations.data}
      conversationsPending={conversations.isPending}
      conversationsError={conversations.isError}
      speaker={speaker}
      onSpeakerChange={setSpeaker}
      onOtherName={onOtherName}
      onSend={onSend}
      onEdit={(id, text) => editMessage({ id: id as Id<"messages">, text })}
      onDelete={(message) => deleteMessage({ id: message.id as Id<"messages"> })}
      onRestore={(message) => {
        if (!conversationId) return undefined;
        return restoreMessage({ conversationId, message });
      }}
      onOpenConversation={openConversation}
      onNewConversation={startNew}
      onRenameConversation={(id, name) => rename({ id, otherName: name })}
      onDeleteConversation={onDeleteConversation}
    />
  );
}

function LocalTalk() {
  const local = useLocalConversation();
  const currentUser = useCurrentUser();
  const [speaker, setSpeaker] = useState<Sender>("me");

  return (
    <ConversationView
      canSave={false}
      messages={local.messages}
      otherName={local.otherName}
      meName={currentUser.data?.name ?? ""}
      isPending={false}
      isMissing={false}
      isError={false}
      activeId={null}
      conversations={[]}
      conversationsPending={false}
      conversationsError={false}
      speaker={speaker}
      onSpeakerChange={setSpeaker}
      onOtherName={local.setOtherName}
      onSend={(text, sender) => {
        local.send(text, sender);
      }}
      onEdit={local.edit}
      onDelete={(message) => {
        local.remove(message.id);
      }}
      onRestore={local.restore}
      onOpenConversation={() => undefined}
      onNewConversation={() => {
        setSpeaker("me");
        local.reset();
      }}
      onRenameConversation={() => undefined}
      onDeleteConversation={() => undefined}
    />
  );
}

export function ConversationPage() {
  const { user, isLoading } = db.useAuth();
  if (isLoading) {
    return (
      <div className="flex h-svh flex-col gap-3 p-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-2/3" />
      </div>
    );
  }
  if (user && isAllowedEmail(user.email)) return <SavedTalk />;
  return <LocalTalk />;
}
