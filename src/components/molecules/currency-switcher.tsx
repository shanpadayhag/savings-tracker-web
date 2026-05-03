"use client";

// Currency switcher.
// Compact dropdown that toggles the page-wide active currency. Lives in
// dashboard / reports headers but reads from a global context so switching
// on one page is reflected everywhere else.
//
// If the user only holds a single currency the control becomes a static label
// (no need to make them click a useless dropdown).

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency, { currencyLabel } from '@/enums/currency';
import { IconCoin } from '@tabler/icons-react';

const CurrencySwitcher = () => {
  const { activeCurrency, setActiveCurrency, availableCurrencies } = useActiveCurrency();

  if (availableCurrencies.length <= 1) {
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
          <SelectLabel>Viewing</SelectLabel>
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
