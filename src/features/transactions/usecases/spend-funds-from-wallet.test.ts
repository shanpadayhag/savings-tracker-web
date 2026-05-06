import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/app-db-util', () => import('@/test/fakes/app-db-fake'));
vi.mock('@/utils/document-db-util', () => import('@/test/fakes/document-db-fake'));

import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import spendFundsFromWallet from '@/features/transactions/usecases/spend-funds-from-wallet';
import appDBFake from '@/test/fakes/app-db-fake';
import documentDBFake from '@/test/fakes/document-db-fake';

const seedWallet = async (overrides: Partial<{ id: string; currentAmount: number; currency: Currency; name: string; }> = {}) => {
  const wallet = {
    id: overrides.id ?? 'wallet-1',
    name: overrides.name ?? 'Cash',
    currency: overrides.currency ?? Currency.USD,
    currentAmount: overrides.currentAmount ?? 100,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };
  await documentDBFake.wallet_list.add(wallet);
  return wallet;
};

const seedCategory = async (overrides: Partial<{ id: string; name: string; color: string; deletedAt: Date | 'null'; }> = {}) => {
  await appDBFake.categories.add({
    id: overrides.id ?? 'category-groceries',
    name: overrides.name ?? 'Groceries',
    color: overrides.color ?? '#00ff00',
    isSystem: false,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: overrides.deletedAt ?? 'null',
  });
};

describe('spendFundsFromWallet', () => {
  beforeEach(() => {
    appDBFake.reset();
    documentDBFake.reset();
  });

  it('debits the wallet by the parsed amount', async () => {
    await seedWallet({ currentAmount: 250.50 });
    await seedCategory();

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '49.50',
      categoryID: 'category-groceries',
      notes: '',
    });

    const updated = await documentDBFake.wallet_list.get('wallet-1');
    expect(updated?.currentAmount).toBe(201);
  });

  it('emits a Wallet/From and External/To entry pair with the same amount', async () => {
    await seedWallet({ currentAmount: 500 });
    await seedCategory();

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '125.50',
      categoryID: 'category-groceries',
      notes: '',
    });

    const entries = appDBFake.transaction_entries.list();
    expect(entries).toHaveLength(2);
    const fromEntry = entries.find(entry => entry.direction === TransactionDirection.From);
    const toEntry = entries.find(entry => entry.direction === TransactionDirection.To);
    expect(fromEntry).toMatchObject({
      sourceType: TransactionSourceType.Wallet,
      sourceID: 'wallet-1',
      amount: 125.50,
      currency: Currency.USD,
    });
    expect(toEntry).toMatchObject({
      sourceType: TransactionSourceType.External,
      sourceID: null,
      amount: 125.50,
      currency: Currency.USD,
    });
  });

  it('writes a Spend transaction tagged with the provided category', async () => {
    await seedWallet({ currentAmount: 500 });
    await seedCategory({ id: 'category-groceries', name: 'Groceries', color: '#00ff00' });

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '40',
      categoryID: 'category-groceries',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(TransactionType.Spend);
    expect(transactions[0].categoryID).toBe('category-groceries');

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.categoryID).toBe('category-groceries');
    expect(transactionListRow.categoryName).toBe('Groceries');
    expect(transactionListRow.categoryColor).toBe('#00ff00');
  });

  it('trims notes and stores null when blank', async () => {
    await seedWallet({ currentAmount: 500 });
    await seedCategory();

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '10',
      categoryID: 'category-groceries',
      notes: '   ',
    });

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].notes).toBeNull();
  });

  it('rejects when the wallet does not exist', async () => {
    await seedCategory();

    await expect(spendFundsFromWallet({
      walletID: 'missing',
      amount: '10',
      categoryID: 'category-groceries',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when no walletID is given', async () => {
    await seedCategory();

    await expect(spendFundsFromWallet({
      amount: '10',
      categoryID: 'category-groceries',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects a non-positive amount without mutating the wallet', async () => {
    await seedWallet({ currentAmount: 100 });
    await seedCategory();

    await expect(spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '0',
      categoryID: 'category-groceries',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet-1');
    expect(wallet?.currentAmount).toBe(100);
  });

  it('rejects a negative amount', async () => {
    await seedWallet({ currentAmount: 100 });
    await seedCategory();

    await expect(spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '-25',
      categoryID: 'category-groceries',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);
  });

  it('rejects when the wallet cannot cover the spend', async () => {
    await seedWallet({ currentAmount: 30 });
    await seedCategory();

    await expect(spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '100',
      categoryID: 'category-groceries',
      notes: '',
    })).rejects.toBeInstanceOf(AppError);

    const wallet = await documentDBFake.wallet_list.get('wallet-1');
    expect(wallet?.currentAmount).toBe(30);
  });

  it('falls back to the seeded "Others" category when none is provided', async () => {
    await seedWallet({ currentAmount: 100 });

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '10',
      notes: '',
    });

    const seededCategory = appDBFake.categories.list()
      .find(category => category.name === 'Others');
    expect(seededCategory).toBeDefined();

    const transactions = appDBFake.transactions.list();
    expect(transactions[0].categoryID).toBe(seededCategory?.id);

    const transactionListRow = documentDBFake.transaction_list.list()[0];
    expect(transactionListRow.categoryID).toBe(seededCategory?.id);
    expect(transactionListRow.categoryName).toBe('Others');
  });

  it('falls back to "Others" when the provided category is soft-deleted', async () => {
    await seedWallet({ currentAmount: 100 });
    await seedCategory({ id: 'category-old', deletedAt: new Date('2026-02-01') });

    await spendFundsFromWallet({
      walletID: 'wallet-1',
      amount: '10',
      categoryID: 'category-old',
      notes: '',
    });

    const transactions = appDBFake.transactions.list();
    const seededCategory = appDBFake.categories.list().find(category => category.name === 'Others');
    expect(transactions[0].categoryID).toBe(seededCategory?.id);
  });
});
