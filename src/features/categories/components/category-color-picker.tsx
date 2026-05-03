"use client";

// Color swatch picker for the category dialogs.
// Uses a fixed palette (instead of a free-form picker) so categories stay
// visually distinct in charts and badges. The selected swatch gets a ring
// outline so the choice is obvious without needing a separate label.

import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import { cn } from '@/utils/cn';

type CategoryColorPickerProps = {
  value: string;
  onChange: (color: string) => void;
};

const CategoryColorPicker = (props: CategoryColorPickerProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categoryColorPalette.map(color => {
        const isSelected = color.value === props.value;
        return (
          <button
            key={color.value}
            type="button"
            aria-label={color.label}
            aria-pressed={isSelected}
            onClick={() => props.onChange(color.value)}
            className={cn(
              "size-7 rounded-full transition-all hover:scale-110",
              isSelected && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
            style={{ backgroundColor: color.value }} />
        );
      })}
    </div>
  );
};

export default CategoryColorPicker;
