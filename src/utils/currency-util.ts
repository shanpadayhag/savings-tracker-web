import Currency from '@/enums/currency';
import currency from 'currency.js';

const currencyOptions = {
  EURO: { symbol: '€', precision: 2, decimal: ',', separator: '.', pattern: `! #` },
  CAD: { symbol: 'CA$', precision: 2, pattern: `! #` },
  USD: { symbol: '$', precision: 2, pattern: `! #` },
  PESO: { symbol: '₱', precision: 2, pattern: `! #` }
};

const currencyUtil = {
  /**
   * Parses a value (string, number) into a currency.js object
   * based on a dynamic currency code. Defaults to 'EURO'.
   * @param value The string, number, or decimal to parse.
   * @param code The currency code to use for parsing rules. Defaults to 'EURO'.
   * @returns A currency object.
   */
  parse(value: currency.Any, code: Currency = Currency.Euro): currency {
    const options = currencyOptions[code] || currencyOptions.EURO;
    return currency(value, options);
  },

  /**
   * Formats a numeric value based on a dynamic currency code.
   * Defaults to 'EURO' if no code is provided.
   * @param value The number to format.
   * @param code The currency code to use for formatting. Defaults to 'EURO'.
   * @returns The formatted currency string.
   */
  format(value: currency.Any, code: Currency = Currency.Euro): string {
    return this.parse(value, code).format();
  }
};

export default currencyUtil;
