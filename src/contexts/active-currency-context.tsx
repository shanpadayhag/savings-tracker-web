"use client";

// Active-currency context.
// Holds the single source of truth for which currency the user is currently
// viewing. Lives high in the tree (user layout) so dashboard, reports, and
// any future feature can read and write the same value — switching on the
// dashboard persists when the user navigates to reports.
//
// Aggregations should NEVER sum across currencies. Components read the active
// currency from this context and partition their data by it.

import Currency from '@/enums/currency';
import { ReactNode, createContext, useContext, useState } from 'react';

type ActiveCurrencyContextValue = {
  /** The currency the user is currently viewing. */
  activeCurrency: Currency;
  setActiveCurrency: (currency: Currency) => void;
  /** The currencies the user actually holds. Switcher option list. */
  availableCurrencies: Currency[];
};

const ActiveCurrencyContext = createContext<ActiveCurrencyContextValue | null>(null);

type ActiveCurrencyProviderProps = {
  children: ReactNode;
  initialCurrency: Currency;
  availableCurrencies: Currency[];
};

export const ActiveCurrencyProvider = (props: ActiveCurrencyProviderProps) => {
  const [activeCurrency, setActiveCurrency] = useState<Currency>(props.initialCurrency);

  return (
    <ActiveCurrencyContext.Provider value={{
      activeCurrency,
      setActiveCurrency,
      availableCurrencies: props.availableCurrencies,
    }}>
      {props.children}
    </ActiveCurrencyContext.Provider>
  );
};

export const useActiveCurrency = () => {
  const ctx = useContext(ActiveCurrencyContext);
  if (!ctx) throw new Error('useActiveCurrency must be used within an ActiveCurrencyProvider');
  return ctx;
};
