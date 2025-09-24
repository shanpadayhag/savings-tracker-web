import Currency from '@/enums/currency';
import currency from 'currency.js';

// Map currency codes to their specific formatting options
const currencyFormatters: Record<`${Currency}`, (value: number) => string> = {
  EURO: (value) => currency(value, { symbol: '€', precision: 2, decimal: ',', separator: '.', pattern: `! #` }).format(),
  CAD: (value) => currency(value, { symbol: 'CA$', precision: 2, pattern: `! #` }).format(),
  USD: (value) => currency(value, { symbol: '$', precision: 2, pattern: `! #` }).format(),
  PESO: (value) => currency(value, { symbol: '₱', precision: 2, pattern: `! #` }).format()
};

export const currencyUtil = {
  /**
   * Formats a numeric value based on a dynamic currency code.
   * Defaults to 'EURO' if no code is provided.
   * @param value The number to format.
   * @param code The currency code to use for formatting. Defaults to 'EURO'.
   * @returns The formatted currency string.
   */
  format(value: number, code: Currency = Currency.Euro): string {
    return currencyFormatters[code](value);
  }
};

