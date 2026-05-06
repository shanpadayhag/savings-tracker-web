"use client";

// Category picker for transaction dialogs.
// Self-contained: loads categories on mount (and seeds "Others" if missing),
// renders a Combobox keyed by category ID, and shows the selected category's
// color dot inline. Callers pass a controlled value/onChange. Skip the
// picker entirely and the spend usecase falls back to "Others" — that's the
// design.

import Combobox, { ComboboxOption } from '@/components/molecules/combobox';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import getCategories from '@/features/categories/api/get-categories';
import Category from '@/features/categories/entities/category';
import { useEffect, useMemo, useState } from 'react';

export type CategoryOption = ComboboxOption<{ color: Category['color']; isSystem: Category['isSystem']; }>;

const NONE_VALUE = "__none__";

const toOption = (category: Category): CategoryOption => ({
  value: category.id,
  label: category.name,
  data: { color: category.color, isSystem: category.isSystem },
});

type CategoryComboboxProps = {
  value?: CategoryOption;
  onChange: (option: CategoryOption | undefined) => void;
  placeholder?: string;
};

const CategoryCombobox = (props: CategoryComboboxProps) => {
  const [options, setOptions] = useState<CategoryOption[]>([]);

  useEffect(() => {
    (async () => {
      await ensureDefaultCategory();
      const categories = await getCategories();
      setOptions(categories.map(toOption));
    })();
  }, []);

  const optionsWithNone = useMemo<CategoryOption[]>(() => [
    { value: NONE_VALUE, label: "None" },
    ...options,
  ], [options]);

  return (
    <Combobox
      placeholder={props.placeholder ?? "Select category"}
      searchPlaceholder="Search categories"
      emptyItemsPlaceholder="No categories found."
      value={props.value}
      onChangeValue={option => props.onChange(option.value === NONE_VALUE ? undefined : option)}
      options={optionsWithNone} />
  );
};

export default CategoryCombobox;
