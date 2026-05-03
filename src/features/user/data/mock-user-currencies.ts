// Mocked profile of which currencies the current user actually holds.
// In production this list would be derived from the user's wallets and goals
// (a `SELECT DISTINCT currency` over both tables) and the primary would come
// from the user's settings record.

import Currency from '@/enums/currency';

// The currencies this user owns balances or goals in. Drives the switcher's
// option list — currencies the user doesn't hold are hidden so the dropdown
// stays short.
export const mockAvailableCurrencies: Currency[] = [
  Currency.USD,
  Currency.Euro,
  Currency.Peso,
];

// The default currency to view first when the user lands on a page that
// shows currency-partitioned data.
export const mockPrimaryCurrency: Currency = Currency.USD;
