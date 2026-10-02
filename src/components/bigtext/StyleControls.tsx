import { useTranslation } from "react-i18next";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  fontFamilies,
  type FontFamilyId,
  type PresetStyle,
  type TextAlign,
} from "@/lib/bigtext/types";

import { ColorSwatch } from "./ColorSwatch";

type StyleControlsProps = {
  style: PresetStyle;
  onChange: (style: PresetStyle) => void;
};

const ALIGN_OPTIONS: TextAlign[] = ["left", "center", "right"];

function fontLabel(family: FontFamilyId, t: (key: string) => string): string {
  if (family === "sans") return t("fontSans");
  if (family === "mono") return t("fontMono");
  return t("fontSerif");
}

function alignLabel(align: TextAlign, t: (key: string) => string): string {
  if (align === "left") return t("alignLeft");
  if (align === "center") return t("alignCenter");
  return t("alignRight");
}

function sliderValue(value: number | readonly number[]): number | undefined {
  return typeof value === "number" ? value : value[0];
}

export function StyleControls({ style, onChange }: StyleControlsProps) {
  const { t } = useTranslation("bigtext");

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="bigtext-font">{t("font")}</FieldLabel>
        <Select
          value={style.fontFamily}
          onValueChange={(next) => {
            const fontFamily = fontFamilies.find((family) => family === next);
            if (!fontFamily) return;
            onChange({ ...style, fontFamily });
          }}
        >
          <SelectTrigger id="bigtext-font" className="w-full">
            <SelectValue>{fontLabel(style.fontFamily, t)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {fontFamilies.map((family) => (
                <SelectItem key={family} value={family}>
                  {fontLabel(family, t)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field orientation="horizontal">
          <FieldLabel>{t("color")}</FieldLabel>
          <ColorSwatch
            value={style.textColor}
            label={t("color")}
            onChange={(textColor) => onChange({ ...style, textColor })}
          />
        </Field>
        <Field orientation="horizontal">
          <FieldLabel>{t("background")}</FieldLabel>
          <ColorSwatch
            value={style.backgroundColor}
            label={t("background")}
            onChange={(backgroundColor) => onChange({ ...style, backgroundColor })}
          />
        </Field>
      </div>
      <Field>
        <FieldLabel>{t("align")}</FieldLabel>
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={1}
          value={[style.align]}
          onValueChange={(next) => {
            const align = next[0];
            if (align !== "left" && align !== "center" && align !== "right") return;
            onChange({ ...style, align });
          }}
        >
          {ALIGN_OPTIONS.map((align) => (
            <ToggleGroupItem key={align} value={align}>
              {alignLabel(align, t)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>{t("padding")}</FieldLabel>
          <span className="text-sm text-muted-foreground">{Math.round(style.padding)}</span>
        </div>
        <Slider
          min={0}
          max={160}
          step={1}
          value={[style.padding]}
          aria-label={t("padding")}
          onValueChange={(value) => {
            const padding = sliderValue(value);
            if (padding === undefined) return;
            onChange({ ...style, padding });
          }}
        />
      </Field>
      <Field>
        <div className="flex items-center justify-between">
          <FieldLabel>{t("lineHeight")}</FieldLabel>
          <span className="text-sm text-muted-foreground">{style.lineHeight.toFixed(2)}</span>
        </div>
        <Slider
          min={0.8}
          max={2}
          step={0.05}
          value={[style.lineHeight]}
          aria-label={t("lineHeight")}
          onValueChange={(value) => {
            const next = sliderValue(value);
            if (next === undefined) return;
            onChange({ ...style, lineHeight: Math.round(next * 100) / 100 });
          }}
        />
      </Field>
    </FieldGroup>
  );
}
