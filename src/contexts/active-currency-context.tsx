"use client";

// Active-currency context.
// Holds the page-wide active currency, the list of currencies the user
// actually holds (derived from wallets), and the recent-use ordering for
// that list. Drives the currency switcher's option order so the most-used
// currency surfaces first.
//
// Persists both the active currency and the recency order to localStorage
// so they survive reloads — true "local-feel" per PRODUCT.md.
//
// Aggregations should NEVER sum across currencies. Components read the
// active currency from this context and partition their data by it.

import Currency from '@/enums/currency';
import walletRepository from '@/features/wallets/repositories/wallet-repository';
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ActiveCurrencyContextValue = {
  /** The currency the user is currently viewing. */
  activeCurrency: Currency;
  setActiveCurrency: (currency: Currency) => void;
  /** Currencies the user actually holds, ordered most-recently-used first. */
  availableCurrencies: Currency[];
  /** Re-derive available currencies from the wallets table. Call after
   * mutations that change wallet currencies (create / archive). */
  refreshAvailable: () => Promise<void>;
  /** Cycles to the next available currency. Wired to ⌘. / Ctrl+. and
   * exposed for any UI affordance that needs it. */
  cycleNext: () => void;
};

const ActiveCurrencyContext = createContext<ActiveCurrencyContextValue | null>(null);

const ACTIVE_KEY = 'savings-tracker:active-currency';
const RECENCY_KEY = 'savings-tracker:currency-recency';

const isCurrency = (value: unknown): value is Currency =>
  typeof value === 'string' && Object.values(Currency).includes(value as Currency);

const readActive = (): Currency | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(ACTIVE_KEY);
  return isCurrency(stored) ? stored : null;
};

const readRecency = (): Currency[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENCY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCurrency);
  } catch {
    return [];
  }
};

const writeActive = (value: Currency) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_KEY, value);
};

const writeRecency = (value: Currency[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RECENCY_KEY, JSON.stringify(value));
};

export const ActiveCurrencyProvider = ({ children }: { children: ReactNode; }) => {
  const [walletCurrencies, setWalletCurrencies] = useState<Currency[]>([]);
  const [activeCurrency, setActiveCurrencyState] = useState<Currency>(Currency.USD);
  const [recency, setRecency] = useState<Currency[]>([]);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const storedActive = readActive();
    if (storedActive) setActiveCurrencyState(storedActive);
    setRecency(readRecency());
  }, []);

  const refreshAvailable = useCallback(async () => {
    try {
      const wallets = await walletRepository.getWallets();
      const distinct = Array.from(new Set(wallets.map(wallet => wallet.currency)));
      setWalletCurrencies(distinct);
    } catch {
      setWalletCurrencies([]);
    }
  }, []);

  useEffect(() => { refreshAvailable(); }, [refreshAvailable]);

  // Order available currencies by recency: most-recent first, then any the
  // user hasn't touched yet, in their natural enum order.
  const availableCurrencies = useMemo(() => {
    const inRecency = recency.filter(currency => walletCurrencies.includes(currency));
    const untouched = walletCurrencies.filter(currency => !inRecency.includes(currency));
    return [...inRecency, ...untouched];
  }, [recency, walletCurrencies]);

  // If the active currency is no longer something the user holds (wallet
  // archived, account reset, etc.), fall forward to the first available.
  useEffect(() => {
    if (availableCurrencies.length === 0) return;
    if (!availableCurrencies.includes(activeCurrency)) {
      setActiveCurrencyState(availableCurrencies[0]);
    }
  }, [availableCurrencies, activeCurrency]);

  const setActiveCurrency = useCallback((currency: Currency) => {
    setActiveCurrencyState(currency);
    writeActive(currency);
    setRecency(prev => {
      const next = [currency, ...prev.filter(item => item !== currency)];
      writeRecency(next);
      return next;
    });
  }, []);

  const cycleNext = useCallback(() => {
    if (availableCurrencies.length <= 1) return;
    const index = availableCurrencies.indexOf(activeCurrency);
    const nextIndex = index === -1 ? 0 : (index + 1) % availableCurrencies.length;
    const next = availableCurrencies[nextIndex];
    setActiveCurrency(next);
  }, [availableCurrencies, activeCurrency, setActiveCurrency]);

  // ⌘. (Mac) / Ctrl+. (Win/Linux) cycles to the next available currency.
  // Period is uncommon in form input so this rarely conflicts with typing.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '.') return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      cycleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleNext]);

  return (
    <ActiveCurrencyContext.Provider value={{
      activeCurrency,
      setActiveCurrency,
      availableCurrencies,
      refreshAvailable,
      cycleNext,
    }}>
      {children}
    </ActiveCurrencyContext.Provider>
  );
};

export const useActiveCurrency = () => {
  const ctx = useContext(ActiveCurrencyContext);
  if (!ctx) throw new Error('useActiveCurrency must be used within an ActiveCurrencyProvider');
  return ctx;
};
