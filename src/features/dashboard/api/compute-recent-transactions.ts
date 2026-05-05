import Currency from '@/enums/currency';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import documentDBUtil from '@/utils/document-db-util';

export type RecentActivityPrefix = '+' | '-' | '';

export type RecentActivityRow = {
  id: string;
  type: TransactionType;
  /** Bold primary line — destination/goal/source→dest depending on type. */
  label: string;
  /** Muted secondary line — counterparty, notes, or transaction kind. */
  counterparty: string;
  /** Always positive — sign goes on `prefix`. */
  amount: number;
  prefix: RecentActivityPrefix;
  currency: Currency;
  createdAt: Date;
};

const DEFAULT_LIMIT = 5;

type Entry = {
  type: TransactionSourceType;
  sourceID: string | null;
  name: string | null;
  currency: Currency;
  direction: TransactionDirection;
  amount: number;
};

type Row = {
  id?: string;
  type: TransactionType;
  notes: string | null;
  entries: Entry[];
  createdAt?: Date;
};

const findEntry = (entries: Entry[], predicate: (entry: Entry) => boolean): Entry | undefined =>
  entries.find(predicate);

const isWalletOrGoal = (entry: Entry): boolean =>
  entry.type === TransactionSourceType.Wallet || entry.type === TransactionSourceType.Goal;

const buildAllocateRow = (row: Row, currency: Currency): RecentActivityRow | null => {
  const destination = findEntry(row.entries, entry =>
    entry.direction === TransactionDirection.To
    && entry.currency === currency
    && isWalletOrGoal(entry));
  if (!destination) return null;

  const source = findEntry(row.entries, entry =>
    entry.direction === TransactionDirection.From
    && entry.currency === currency);
  const counterparty = source?.type === TransactionSourceType.External
    ? 'Funds added'
    : source?.name ? `from ${source.name}` : 'Allocated';

  return {
    id: row.id!,
    type: row.type,
    label: destination.name ?? 'Wallet',
    counterparty,
    amount: destination.amount,
    prefix: '+',
    currency,
    createdAt: row.createdAt!,
  };
};

const buildSpendRow = (row: Row, currency: Currency): RecentActivityRow | null => {
  const goalEntry = findEntry(row.entries, entry =>
    entry.type === TransactionSourceType.Goal
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  if (!goalEntry) return null;

  return {
    id: row.id!,
    type: row.type,
    label: goalEntry.name ?? 'Goal',
    counterparty: row.notes?.trim() || 'Spent',
    amount: goalEntry.amount,
    prefix: '-',
    currency,
    createdAt: row.createdAt!,
  };
};

const buildDeallocateRow = (row: Row, currency: Currency): RecentActivityRow | null => {
  const goalEntry = findEntry(row.entries, entry =>
    entry.type === TransactionSourceType.Goal
    && entry.direction === TransactionDirection.From
    && entry.currency === currency);
  if (!goalEntry) return null;

  const walletEntry = findEntry(row.entries, entry =>
    entry.type === TransactionSourceType.Wallet
    && entry.direction === TransactionDirection.To
    && entry.currency === currency);

  return {
    id: row.id!,
    type: row.type,
    label: goalEntry.name ?? 'Goal',
    counterparty: walletEntry?.name ? `to ${walletEntry.name}` : 'Returned',
    amount: goalEntry.amount,
    prefix: '-',
    currency,
    createdAt: row.createdAt!,
  };
};

const buildTransferRow = (row: Row, currency: Currency): RecentActivityRow | null => {
  // Transfer is same-currency for both wallets and goals.
  const fromEntry = findEntry(row.entries, entry =>
    entry.direction === TransactionDirection.From
    && entry.currency === currency
    && isWalletOrGoal(entry));
  const toEntry = findEntry(row.entries, entry =>
    entry.direction === TransactionDirection.To
    && entry.currency === currency
    && isWalletOrGoal(entry));
  if (!fromEntry || !toEntry) return null;

  return {
    id: row.id!,
    type: row.type,
    label: `${fromEntry.name ?? '?'} → ${toEntry.name ?? '?'}`,
    counterparty: 'Transfer',
    amount: fromEntry.amount,
    // Internal move — no net change to the active currency. No sign.
    prefix: '',
    currency,
    createdAt: row.createdAt!,
  };
};

const buildConvertRow = (row: Row, currency: Currency): RecentActivityRow | null => {
  // Convert is across currencies. The active-currency wallet entry could be
  // either side; sign follows its direction.
  const activeWallet = findEntry(row.entries, entry =>
    entry.type === TransactionSourceType.Wallet && entry.currency === currency);
  const otherWallet = findEntry(row.entries, entry =>
    entry.type === TransactionSourceType.Wallet && entry !== activeWallet);
  if (!activeWallet || !otherWallet) return null;

  const isInflow = activeWallet.direction === TransactionDirection.To;
  const sourceLabel = isInflow ? otherWallet.name : activeWallet.name;
  const destinationLabel = isInflow ? activeWallet.name : otherWallet.name;

  return {
    id: row.id!,
    type: row.type,
    label: `${sourceLabel ?? '?'} → ${destinationLabel ?? '?'}`,
    counterparty: 'Convert',
    amount: activeWallet.amount,
    prefix: isInflow ? '+' : '-',
    currency,
    createdAt: row.createdAt!,
  };
};

const mapRowFor = (row: Row, currency: Currency): RecentActivityRow | null => {
  if (!row.id || !row.createdAt) return null;
  switch (row.type) {
    case TransactionType.Allocate: return buildAllocateRow(row, currency);
    case TransactionType.Spend: return buildSpendRow(row, currency);
    case TransactionType.Deallocate: return buildDeallocateRow(row, currency);
    case TransactionType.Transfer: return buildTransferRow(row, currency);
    case TransactionType.Convert: return buildConvertRow(row, currency);
    default: return null;
  }
};

type ComputeOptions = {
  /** Cap on the number of rows returned. Defaults to 5. */
  limit?: number;
};

const computeRecentTransactions = async (
  currency: Currency,
  options: ComputeOptions = {},
): Promise<RecentActivityRow[]> => {
  const limit = Math.max(1, options.limit ?? DEFAULT_LIMIT);

  const all = await documentDBUtil.transaction_list.toArray();
  const matching = all
    .filter(row => row.entries.some(entry => entry.currency === currency))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  const rows: RecentActivityRow[] = [];
  for (const row of matching) {
    const mapped = mapRowFor(row, currency);
    if (mapped) rows.push(mapped);
    if (rows.length >= limit) break;
  }
  return rows;
};

export default computeRecentTransactions;
