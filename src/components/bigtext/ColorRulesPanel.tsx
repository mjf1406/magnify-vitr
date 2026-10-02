import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ruleLabelKey, type ColorRule } from "@/lib/bigtext/types";

import { ColorSwatch } from "./ColorSwatch";

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
    <FieldGroup className="gap-3">
      <Field className="gap-1">
        <FieldTitle>{t("rulesTitle")}</FieldTitle>
        <FieldDescription>{t("rulesHint")}</FieldDescription>
      </Field>
      {rules.map((rule) => {
        const switchId = `color-rule-${rule.id}`;
        return (
          <Field key={rule.id} orientation="horizontal" className="flex-wrap">
            <Switch
              id={switchId}
              checked={rule.enabled}
              aria-label={t(ruleLabelKey(rule.kind))}
              onCheckedChange={(checked) => update(rule.id, { enabled: checked })}
            />
            <FieldLabel htmlFor={switchId} className="min-w-24">
              {t(ruleLabelKey(rule.kind))}
            </FieldLabel>
            <ColorSwatch
              value={rule.color}
              label={t("color")}
              onChange={(color) => update(rule.id, { color })}
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
          </Field>
        );
      })}
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
    </FieldGroup>
  );
}
