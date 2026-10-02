import type { ChangeEvent } from "react";

import { isHexColor } from "@/lib/bigtext/types";

type ColorSwatchProps = {
  value: string;
  label: string;
  disabled?: boolean;
  onChange: (color: string) => void;
};

export function ColorSwatch({ value, label, disabled, onChange }: ColorSwatchProps) {
  return (
    <label className="relative inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <span className="size-6 rounded-full" style={{ backgroundColor: value }} aria-hidden />
      <input
        type="color"
        aria-label={label}
        value={value}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          if (!isHexColor(event.target.value)) return;
          onChange(event.target.value);
        }}
      />
    </label>
  );
}
