import { describe, expect, it } from 'vitest';

import { AppError } from '@/errors/app-error';
import { USER_DATA_SCHEMA_VERSION } from '@/features/user/entities/user-data-export';
import parseUserDataImport from '@/features/user/usecases/parse-user-data-import';

const validBase = () => ({
  schemaVersion: USER_DATA_SCHEMA_VERSION,
  exportedAt: '2026-05-15T00:00:00.000Z',
  user: { id: 'u-1' },
  wallets: [],
  goals: [],
  goalVersions: [],
  transactions: [],
  transactionEntries: [],
  categories: [],
});

describe('parseUserDataImport', () => {
  it('accepts a well-formed export without changes', () => {
    const parsed = parseUserDataImport(validBase());

    expect(parsed.user).toEqual({ id: 'u-1' });
    expect(parsed.wallets).toEqual([]);
    expect(parsed.categories).toEqual([]);
  });

  it('rejects non-object input', () => {
    expect(() => parseUserDataImport(null)).toThrow(AppError);
    expect(() => parseUserDataImport('hello')).toThrow(AppError);
    expect(() => parseUserDataImport(42)).toThrow(AppError);
  });

  it('rejects missing user', () => {
    const data = validBase();
    // @ts-expect-error testing invalid input
    delete data.user;
    expect(() => parseUserDataImport(data)).toThrow(AppError);
  });

  it('rejects when the schemaVersion is newer than the app supports', () => {
    const data = { ...validBase(), schemaVersion: USER_DATA_SCHEMA_VERSION + 1 };
    expect(() => parseUserDataImport(data)).toThrow(AppError);
  });

  it('hydrates ISO date strings back into Date objects', () => {
    const data = {
      ...validBase(),
      wallets: [{
        id: 'w', name: 'Cash', currency: 'USD',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        deletedAt: 'null',
      }],
    };

    const parsed = parseUserDataImport(data);

    expect(parsed.wallets[0].createdAt).toBeInstanceOf(Date);
    expect(parsed.wallets[0].updatedAt).toBeInstanceOf(Date);
    expect(parsed.wallets[0].deletedAt).toBe('null');
  });

  it('treats a missing categories array as empty (legacy export back-compat)', () => {
    const data = validBase();
    // @ts-expect-error testing missing field
    delete data.categories;

    const parsed = parseUserDataImport(data);

    expect(parsed.categories).toEqual([]);
  });

  it('treats missing arrays as empty without throwing', () => {
    const data = { user: { id: 'u-1' } };

    const parsed = parseUserDataImport(data);

    expect(parsed.wallets).toEqual([]);
    expect(parsed.goals).toEqual([]);
    expect(parsed.goalVersions).toEqual([]);
    expect(parsed.transactions).toEqual([]);
    expect(parsed.transactionEntries).toEqual([]);
  });

  it('skips non-object entries inside an array', () => {
    const data = {
      ...validBase(),
      wallets: [{ id: 'good' }, null, 'not-a-row', 42],
    };

    const parsed = parseUserDataImport(data);

    expect(parsed.wallets).toHaveLength(1);
    expect(parsed.wallets[0]).toMatchObject({ id: 'good' });
  });

  it('defaults schemaVersion to the current version when missing', () => {
    const data = { user: { id: 'u-1' } };

    const parsed = parseUserDataImport(data);

    expect(parsed.schemaVersion).toBe(USER_DATA_SCHEMA_VERSION);
  });
});
