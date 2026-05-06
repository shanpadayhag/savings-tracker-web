"use client";

// Color picker for the category dialogs.
// Two ways in: pick from the curated palette (keeps charts/badges visually
// coherent), or punch in a custom hex via the native color picker or text
// field. The selected swatch gets a ring outline so the choice is obvious
// without a separate label.

import { Input } from '@/components/atoms/input';
import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const normalize = (hex: string) => hex.trim().toLowerCase();

const isPaletteColor = (hex: string) =>
  categoryColorPalette.some(color => color.value.toLowerCase() === hex.toLowerCase());

type CategoryColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

const CategoryColorPicker = (props: CategoryColorPickerProps) => {
  // Local draft for the hex input so users can type intermediate states
  // (e.g., "#22c5") without us spamming onChange. We only commit upstream
  // once the value parses as a complete hex.
  const [draft, setDraft] = useState(props.value);

  useEffect(() => {
    setDraft(props.value);
  }, [props.value]);

  const handleHexChange = (raw: string) => {
    const next = raw.startsWith('#') ? raw : `#${raw}`;
    setDraft(next);
    if (HEX_COLOR_PATTERN.test(next)) props.onChange(normalize(next));
  };

  const handleNativeColorChange = (raw: string) => {
    const next = normalize(raw);
    setDraft(next);
    props.onChange(next);
  };

  const showsCustomSelection = HEX_COLOR_PATTERN.test(props.value)
    && !isPaletteColor(props.value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {categoryColorPalette.map(color => {
          const isSelected = normalize(color.value) === normalize(props.value);
          return (
            <button
              key={color.value}
              type="button"
              aria-label={color.label}
              aria-pressed={isSelected}
              onClick={() => props.onChange(normalize(color.value))}
              className={cn(
                "size-7 rounded-full transition-all hover:scale-110",
                isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
              style={{ backgroundColor: color.value }} />
          );
        })}
      </div>

      <div className="flex items-center gap-3 border-t pt-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Custom
        </span>
        <label className={cn(
          "relative inline-block size-7 cursor-pointer rounded-full transition-all hover:scale-110",
          showsCustomSelection && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}>
          <span className="block size-full rounded-full ring-1 ring-border"
            style={{ backgroundColor: HEX_COLOR_PATTERN.test(draft) ? draft : '#ffffff' }}
            aria-hidden="true" />
          <input
            type="color"
            value={HEX_COLOR_PATTERN.test(draft) ? draft : '#000000'}
            onChange={event => handleNativeColorChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            aria-label="Custom color picker" />
        </label>
        <Input
          value={draft}
          onChange={event => handleHexChange(event.target.value)}
          placeholder="#22c55e"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          maxLength={7}
          className="h-8 w-32 font-mono text-sm" />
      </div>
    </div>
  );
};

export default CategoryColorPicker;
