import Currency from '@/enums/currency';
import currency from 'currency.js';

const currencyOptions = {
  EURO: { symbol: '€', precision: 2, decimal: ',', separator: '.', pattern: `! #`, negativePattern: "! #" },
  CAD: { symbol: 'CA$', precision: 2, pattern: `! #`, negativePattern: "! #" },
  USD: { symbol: '$', precision: 2, pattern: `! #`, negativePattern: "! #" },
  PESO: { symbol: '₱', precision: 2, pattern: `! #`, negativePattern: "! #" }
};

const currencyUtil = {
  /**
   * Parses a value (string, number) into a currency.js object
   * based on a dynamic currency code. Defaults to 'EURO'.
   * @param value The string, number, or decimal to parse.
   * @param code The currency code to use for parsing rules. Defaults to 'EURO'.
   * @returns A currency object.
   */
  parse(value: currency.Any, code: Currency): currency {
    const options = currencyOptions[code];
    return currency(value, options);
  },

  /**
   * Formats a numeric value based on a dynamic currency code.
   * Defaults to 'EURO' if no code is provided.
   * @param value The number to format.
   * @param code The currency code to use for formatting. Defaults to 'EURO'.
   * @returns The formatted currency string.
   */
  format(value: currency.Any, code: Currency): string {
    return this.parse(value, code).format();
  },

  /**
   * Parses a value into a currency.js object configured for
   * percentage formatting, using the number rules from a currency.
   * @param value The number to parse.
   * @param code The currency code to use for formatting rules.
   * @returns A currency object.
   */
  parsePercent(value: currency.Any, code: Currency): currency {
    const currencyOpts = currencyOptions[code];
    const percentOptions = { ...currencyOpts, pattern: '# %', symbol: '%' };

    return currency(value, percentOptions);
  }
};

export default currencyUtil;
