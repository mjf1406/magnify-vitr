import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { isHexColor, ruleLabelKey, type ColorRule } from "@/lib/bigtext/types";

type ColorRulesPanelProps = {
  rules: ColorRule[];
  onChange: (rules: ColorRule[]) => void;
};

export function ColorRulesPanel({ rules, onChange }: ColorRulesPanelProps) {
  const { t } = useTranslation("bigtext");

  function update(id: string, patch: Partial<ColorRule>) {
    onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium">{t("rulesTitle")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("rulesHint")}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {rules.map((rule) => (
          <li key={rule.id} className="flex flex-wrap items-center gap-2">
            <Switch
              checked={rule.enabled}
              aria-label={t(ruleLabelKey(rule.kind))}
              onCheckedChange={(checked) => update(rule.id, { enabled: checked })}
            />
            <span className="min-w-24 text-sm">{t(ruleLabelKey(rule.kind))}</span>
            <input
              type="color"
              aria-label={t("color")}
              value={rule.color}
              className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
              onChange={(event) => {
                if (!isHexColor(event.target.value)) return;
                update(rule.id, { color: event.target.value });
              }}
            />
            {rule.kind === "custom" ? (
              <>
                <Input
                  aria-label={t("customChars")}
                  value={rule.chars ?? ""}
                  placeholder={t("customCharsPlaceholder")}
                  maxLength={64}
                  className="w-28"
                  onChange={(event) => update(rule.id, { chars: event.target.value })}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}
                >
                  {t("removeRule")}
                </Button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() =>
          onChange([
            ...rules,
            {
              id: `custom-${crypto.randomUUID()}`,
              kind: "custom",
              chars: "",
              color: "#f472b6",
              enabled: true,
            },
          ])
        }
      >
        {t("addRule")}
      </Button>
    </section>
  );
}
