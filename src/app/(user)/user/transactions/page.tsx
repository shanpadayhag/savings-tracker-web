"use client";

import { Input } from '@/components/atoms/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import TransactionType, { transactionTypeLabel } from '@/features/transactions/enums/transaction-type';
import useTransactionsEvents from '@/features/transactions/events/use-transactions-events';
import useTransactionsStates, { TransactionTypeFilter } from '@/features/transactions/states/use-transactions-states';
import { cn } from '@/utils/cn';
import dateUtil from '@/utils/date-util';
import {
  IconArrowBackUp,
  IconArrowDownLeft,
  IconArrowNarrowRight,
  IconArrowsLeftRight,
  IconArrowUpRight,
  IconRefresh,
  IconSearch,
} from '@tabler/icons-react';
import { ReactNode, useEffect, useMemo } from 'react';

type TypeStyle = {
  icon: ReactNode;
  /** Tailwind color set for the type chip + leading icon disc. */
  chipClass: string;
  iconWrapClass: string;
  /** Direction sentiment for the amount column. */
  sentiment: 'positive' | 'negative' | 'neutral';
};

const typeStyles: Record<TransactionType, TypeStyle> = {
  [TransactionType.Allocate]: {
    icon: <IconArrowDownLeft className="size-3.5" />,
    chipClass: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    iconWrapClass: 'bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400',
    sentiment: 'positive',
  },
  [TransactionType.Spend]: {
    icon: <IconArrowUpRight className="size-3.5" />,
    chipClass: 'bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    iconWrapClass: 'bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-400',
    sentiment: 'negative',
  },
  [TransactionType.Transfer]: {
    icon: <IconArrowsLeftRight className="size-3.5" />,
    chipClass: 'bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400',
    iconWrapClass: 'bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-400',
    sentiment: 'neutral',
  },
  [TransactionType.Deallocate]: {
    icon: <IconArrowBackUp className="size-3.5" />,
    chipClass: 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    iconWrapClass: 'bg-amber-600/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400',
    sentiment: 'neutral',
  },
  [TransactionType.Convert]: {
    icon: <IconRefresh className="size-3.5" />,
    chipClass: 'bg-sky-600/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-400',
    iconWrapClass: 'bg-sky-600/10 text-sky-700 dark:bg-sky-400/10 dark:text-sky-400',
    sentiment: 'neutral',
  },
};

const filterOrder: TransactionTypeFilter[] = [
  'all',
  TransactionType.Allocate,
  TransactionType.Spend,
  TransactionType.Transfer,
  TransactionType.Deallocate,
  TransactionType.Convert,
];

const filterLabel: Record<TransactionTypeFilter, string> = {
  all: 'All',
  [TransactionType.Allocate]: transactionTypeLabel[TransactionType.Allocate],
  [TransactionType.Spend]: transactionTypeLabel[TransactionType.Spend],
  [TransactionType.Transfer]: transactionTypeLabel[TransactionType.Transfer],
  [TransactionType.Deallocate]: transactionTypeLabel[TransactionType.Deallocate],
  [TransactionType.Convert]: transactionTypeLabel[TransactionType.Convert],
};

const Empty = () => <span className="text-muted-foreground/40">&mdash;</span>;

export default () => {
  const states = useTransactionsStates();
  const events = useTransactionsEvents(states);

  useEffect(() => {
    events.handleFetchTransactions();
  }, []);

  const counts = useMemo(() => {
    const base: Record<TransactionTypeFilter, number> = {
      all: states.transactions.length,
      [TransactionType.Allocate]: 0,
      [TransactionType.Spend]: 0,
      [TransactionType.Transfer]: 0,
      [TransactionType.Deallocate]: 0,
      [TransactionType.Convert]: 0,
    };
    for (const transaction of states.transactions) base[transaction.type] += 1;
    return base;
  }, [states.transactions]);

  const filtered = useMemo(() => {
    if (states.typeFilter === 'all') return states.transactions;
    return states.transactions.filter(t => t.type === states.typeFilter);
  }, [states.transactions, states.typeFilter]);

  return <div className="flex flex-col overflow-auto h-full pb-6 gap-6">
    <div className="w-full px-4 pt-6">
      <p className="eyebrow">Activity</p>
      <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Transactions</h1>
      <p className="mt-2 text-sm text-muted-foreground">A detailed log of all your financial activities. Search and filter to find what you need.</p>
    </div>

    <div className="px-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input disabled className="pl-9" placeholder="Search transactions (coming soon)" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filterOrder.map(filter => {
          const isActive = states.typeFilter === filter;
          const count = counts[filter];
          return (
            <button
              key={filter}
              type="button"
              onClick={() => states.setTypeFilter(filter)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              <span>{filterLabel[filter]}</span>
              <span className={cn(
                'tabular-nums',
                isActive ? 'text-background/70' : 'text-muted-foreground/60'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>

    <div className="px-4">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="numeral-hero text-base font-semibold tabular-nums">{filtered.length}</span>
            <span className="text-xs text-muted-foreground">
              {filtered.length === 1 ? 'transaction' : 'transactions'}
              {states.typeFilter !== 'all' && <> &middot; {filterLabel[states.typeFilter]}</>}
            </span>
          </div>
        </div>

        <Table className="min-w-[640px]">
          <TableHeader className="bg-muted/40 sticky top-0 z-0">
            <TableRow>
              <TableHead className="w-[140px] pl-5">Type</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Movement</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden xl:table-cell">Notes</TableHead>
              <TableHead className="w-2 pr-5"><span className="sr-only">End</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-32">
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <p className="text-sm font-medium">
                      {states.transactions.length === 0
                        ? 'No transactions yet.'
                        : `No ${filterLabel[states.typeFilter].toLowerCase()} transactions.`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {states.transactions.length === 0
                        ? 'Allocate funds to a goal or record a spend to see activity here.'
                        : 'Switch the filter to see other movements.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map(transaction => {
              const style = typeStyles[transaction.type];
              const date = transaction.createdAt;
              const dayLabel = date ? dateUtil.formatDisplayDate(date) : null;
              const isConvert = transaction.type === TransactionType.Convert
                && transaction.amount.length > 1;
              const primaryAmount = transaction.amount[0];
              const sign = style.sentiment === 'positive'
                ? '+'
                : style.sentiment === 'negative' ? '−' : '';
              const amountClass = style.sentiment === 'positive'
                ? 'text-emerald-700 dark:text-emerald-400'
                : style.sentiment === 'negative'
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-foreground';

              return (
                <TableRow key={transaction.id} className="group">
                  <TableCell className="py-4 pl-5">
                    <div className="inline-flex items-center gap-2">
                      <span className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full',
                        style.iconWrapClass)}>
                        {style.icon}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        style.chipClass)}>
                        {transactionTypeLabel[transaction.type]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium tabular-nums">
                        {dayLabel ?? <Empty />}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground">{transaction.from || <Empty />}</span>
                      {(transaction.from || transaction.to) && (
                        <IconArrowNarrowRight className="size-4 text-muted-foreground/60" />
                      )}
                      <span className="text-foreground">{transaction.to || <Empty />}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    {transaction.category
                      ? <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs">
                        <span className="size-2 rounded-full" style={{ backgroundColor: transaction.category.color }} aria-hidden="true" />
                        {transaction.category.name}
                      </span>
                      : <Empty />}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className={cn('numeral-hero text-sm font-semibold tabular-nums', amountClass)}>
                      {isConvert
                        ? <span className="inline-flex items-center gap-1.5">
                          <span>{primaryAmount.format()}</span>
                          <IconArrowNarrowRight className="size-3.5 text-muted-foreground" />
                          <span>{transaction.amount[1].format()}</span>
                        </span>
                        : <span>{sign}{primaryAmount.format()}</span>}
                    </div>
                    {transaction.fee && (
                      <div className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                        fee {transaction.fee.format()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden py-4 text-sm text-muted-foreground xl:table-cell">
                    {transaction.notes
                      ? <span className="line-clamp-1 max-w-[28ch]">{transaction.notes}</span>
                      : <Empty />}
                  </TableCell>
                  <TableCell className="py-4 pr-5"></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  </div>;
};
