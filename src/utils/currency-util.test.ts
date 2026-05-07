import { describe, expect, it } from 'vitest';

import Currency from '@/enums/currency';
import currencyUtil from '@/utils/currency-util';

describe('currencyUtil.format', () => {
  it('formats a positive USD amount with the dollar symbol', () => {
    expect(currencyUtil.format(1234.56, Currency.USD)).toBe('$ 1,234.56');
  });

  it('formats a negative USD amount with a leading minus sign', () => {
    // Regression: negativePattern was identical to the positive pattern,
    // so `-408.10` rendered as "$ 408.10" — making a negative Net Saved
    // appear positive on the reports KPI card.
    expect(currencyUtil.format(-408.10, Currency.USD)).toBe('-$ 408.10');
  });

  it('formats a negative PESO amount with a leading minus sign', () => {
    expect(currencyUtil.format(-1000, Currency.Peso)).toBe('-₱ 1,000.00');
  });

  it('formats a negative EURO amount with European separators', () => {
    expect(currencyUtil.format(-1234.56, Currency.Euro)).toBe('-€ 1.234,56');
  });

  it('formats a negative CAD amount with the CA$ prefix', () => {
    expect(currencyUtil.format(-50, Currency.CAD)).toBe('-CA$ 50.00');
  });

  it('formats zero without a sign', () => {
    expect(currencyUtil.format(0, Currency.USD)).toBe('$ 0.00');
  });
});
