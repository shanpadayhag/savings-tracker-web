// Pre-defined category color palette.
// Categories pick from this fixed set rather than a free-form picker so the
// charts and badges stay visually coherent. The "neutral" entry is reserved
// for the system "Others" row.

export type CategoryColor = {
  /** Token used as the category's stored color value. */
  value: string;
  /** Human-readable label for the picker. */
  label: string;
};

export const categoryColorPalette: CategoryColor[] = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#22c55e', label: 'Green' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#ec4899', label: 'Pink' },
];

/** Default color for the seeded "Others" category. */
export const systemCategoryColor = '#64748b';
