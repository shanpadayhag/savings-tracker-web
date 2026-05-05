"use client";

// Currency switcher.
// Compact dropdown that toggles the page-wide active currency. Lives in
// dashboard / reports headers but reads from a global context so switching
// on one page is reflected everywhere else.
//
// The option list is ordered by recency (most-recently-used first) so the
// user's primary currency surfaces at the top after a few uses. The same
// list can be stepped through with ⌘. / Ctrl+. without opening the dropdown.

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency, { currencyLabel } from '@/enums/currency';
import { IconCoin } from '@tabler/icons-react';

const CurrencySwitcher = () => {
  const { activeCurrency, setActiveCurrency, availableCurrencies } = useActiveCurrency();

  if (availableCurrencies.length === 0) return null;

  if (availableCurrencies.length === 1) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <IconCoin className="size-4" />
        {currencyLabel[activeCurrency]}
      </div>
    );
  }

  return (
    <Select value={activeCurrency} onValueChange={value => setActiveCurrency(value as Currency)}>
      <SelectTrigger size="sm" className="min-w-[8rem]">
        <IconCoin className="size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="flex items-center justify-between gap-4">
            <span>Viewing</span>
            <kbd className="pointer-events-none inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-[11px] leading-none">⌘</span>.
            </kbd>
          </SelectLabel>
          {availableCurrencies.map(currency => (
            <SelectItem key={currency} value={currency}>
              {currencyLabel[currency]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default CurrencySwitcher;
