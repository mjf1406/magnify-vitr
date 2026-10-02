import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fontFamilies, isHexColor, type PresetStyle, type TextAlign } from "@/lib/bigtext/types";

type StyleControlsProps = {
  style: PresetStyle;
  onChange: (style: PresetStyle) => void;
};

const ALIGN_OPTIONS: TextAlign[] = ["left", "center", "right"];

export function StyleControls({ style, onChange }: StyleControlsProps) {
  const { t } = useTranslation("bigtext");

  return (
    <section className="flex flex-col gap-3">
      <Label htmlFor="bigtext-font">{t("font")}</Label>
      <select
        id="bigtext-font"
        className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm"
        value={style.fontFamily}
        onChange={(event) => {
          const fontFamily = fontFamilies.find((family) => family === event.target.value);
          if (!fontFamily) return;
          onChange({ ...style, fontFamily });
        }}
      >
        {fontFamilies.map((family) => (
          <option key={family} value={family}>
            {family === "sans" ? t("fontSans") : family === "mono" ? t("fontMono") : t("fontSerif")}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center justify-between gap-2 text-sm">
          {t("color")}
          <input
            type="color"
            aria-label={t("color")}
            value={style.textColor}
            className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
            onChange={(event) => {
              if (!isHexColor(event.target.value)) return;
              onChange({ ...style, textColor: event.target.value });
            }}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm">
          {t("background")}
          <input
            type="color"
            aria-label={t("background")}
            value={style.backgroundColor}
            className="size-8 cursor-pointer rounded-full border border-border bg-transparent p-0.5"
            onChange={(event) => {
              if (!isHexColor(event.target.value)) return;
              onChange({ ...style, backgroundColor: event.target.value });
            }}
          />
        </label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("align")}</span>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map((align) => (
            <Button
              key={align}
              type="button"
              size="sm"
              variant={style.align === align ? "secondary" : "outline"}
              aria-pressed={style.align === align}
              onClick={() => onChange({ ...style, align })}
            >
              {align === "left"
                ? t("alignLeft")
                : align === "center"
                  ? t("alignCenter")
                  : t("alignRight")}
            </Button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="flex justify-between">
          {t("padding")}
          <span className="text-muted-foreground">{Math.round(style.padding)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={160}
          step={1}
          value={style.padding}
          aria-label={t("padding")}
          onChange={(event) => onChange({ ...style, padding: Number(event.target.value) })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="flex justify-between">
          {t("lineHeight")}
          <span className="text-muted-foreground">{style.lineHeight.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0.8}
          max={2}
          step={0.05}
          value={style.lineHeight}
          aria-label={t("lineHeight")}
          onChange={(event) => onChange({ ...style, lineHeight: Number(event.target.value) })}
        />
      </label>
    </section>
  );
}
