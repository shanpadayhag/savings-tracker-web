// Picks a Tailwind type-size class for a formatted currency string based on
// its character length. Keeps long balances from wrapping or overflowing
// their container while preserving the hero feel for short values.
//
// `emphasize` shifts the scale up one tier — used for the largest KPI tile
// (e.g. dashboard Net Worth) where the figure needs more presence.

export const balanceSizeClass = (
  formatted: string,
  options: { emphasize?: boolean; } = {},
): string => {
  const length = formatted.length;
  if (options.emphasize) {
    if (length <= 8) return 'text-4xl lg:text-5xl';
    if (length <= 11) return 'text-3xl lg:text-4xl';
    if (length <= 14) return 'text-2xl lg:text-3xl';
    return 'text-xl lg:text-2xl';
  }
  if (length <= 8) return 'text-3xl lg:text-[2.25rem]';
  if (length <= 11) return 'text-2xl lg:text-3xl';
  if (length <= 14) return 'text-xl lg:text-2xl';
  return 'text-lg lg:text-xl';
};
