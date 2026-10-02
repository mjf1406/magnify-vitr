import { useState } from "react";
import { ArrowLeftRightIcon, ArrowRightIcon, SendIcon, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  MAX_MESSAGE_LENGTH,
  normalizeMessageText,
  otherSpeaker,
  type Sender,
} from "@/lib/conversation/message";
import { cn } from "@/lib/utils";

type ComposerProps = {
  speaker: Sender;
  speakerName: string;
  disabled?: boolean;
  onSpeakerChange: (speaker: Sender) => void;
  onSend: (text: string, sender: Sender, give: boolean) => void;
};

function SendAction({
  label,
  tooltip,
  keys,
  icon: Icon,
  disabled,
  showLabel,
  onClick,
}: {
  label: string;
  tooltip: string;
  keys: string[];
  icon: LucideIcon;
  disabled: boolean;
  showLabel: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <InputGroupButton
            size={showLabel ? "sm" : "icon-sm"}
            className={cn(showLabel && "h-8", disabled && "opacity-50")}
            variant="default"
            aria-label={label}
            aria-disabled={disabled || undefined}
            onClick={() => {
              if (!disabled) onClick();
            }}
          />
        }
      >
        <Icon data-icon={showLabel ? "inline-start" : undefined} />
        {showLabel ? label : null}
      </TooltipTrigger>
      <TooltipContent>
        {tooltip}
        <KbdGroup>
          {keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}

export function Composer({
  speaker,
  speakerName,
  disabled = false,
  onSpeakerChange,
  onSend,
}: ComposerProps) {
  const { t } = useTranslation("conversation");
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState("");
  const canSend = !disabled && normalizeMessageText(draft).length > 0;
  const giveLabel = speaker === "me" ? t("giveToThem") : t("giveToMe");
  const showLabel = !isMobile;

  function submit(give: boolean) {
    if (!canSend) return;
    onSend(draft, speaker, give);
    setDraft("");
    if (give) onSpeakerChange(otherSpeaker(speaker));
  }

  return (
    <InputGroup>
      <InputGroupAddon align="block-start">
        <Badge variant={speaker === "me" ? "default" : "secondary"}>{speakerName}</Badge>
      </InputGroupAddon>
      <InputGroupTextarea
        value={draft}
        maxLength={MAX_MESSAGE_LENGTH}
        rows={2}
        disabled={disabled}
        placeholder={t("typingAs", { name: speakerName })}
        aria-label={t("messagePlaceholder")}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey || event.altKey) return;
          if (event.nativeEvent.isComposing) return;
          event.preventDefault();
          submit(event.ctrlKey || event.metaKey);
        }}
      />
      <InputGroupAddon align="block-end" className="justify-between">
        <InputGroupButton
          size="icon-sm"
          aria-label={giveLabel}
          disabled={disabled}
          onClick={() => onSpeakerChange(otherSpeaker(speaker))}
        >
          <ArrowLeftRightIcon />
        </InputGroupButton>
        <div className="flex items-center gap-1">
          <SendAction
            label={t("send")}
            tooltip={t("send")}
            keys={[t("keyEnter")]}
            icon={SendIcon}
            disabled={!canSend}
            showLabel={showLabel}
            onClick={() => submit(false)}
          />
          <SendAction
            label={t("give")}
            tooltip={t("sendAndGive")}
            keys={[t("keyCtrl"), t("keyEnter")]}
            icon={ArrowRightIcon}
            disabled={!canSend}
            showLabel={showLabel}
            onClick={() => submit(true)}
          />
        </div>
      </InputGroupAddon>
    </InputGroup>
  );
}
