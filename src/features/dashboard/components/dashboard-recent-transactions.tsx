"use client";

// Recent activity feed.
// Shows the last few transactions in the active currency with a per-type icon
// and color so the user can scan recent money movement at a glance. Filtering
// by currency keeps the feed coherent — mixing $500 and €410 entries would
// invite false comparisons. Cross-currency conversions still show up in both
// currency feeds, with the sign reflecting whether money flowed in or out.

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import Routes from '@/enums/routes';
import computeRecentTransactions, { RecentActivityPrefix, RecentActivityRow } from '@/features/dashboard/api/compute-recent-transactions';
import TransactionType from '@/features/transactions/enums/transaction-type';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';
import { IconArrowDownLeft, IconArrowRight, IconArrowsExchange, IconArrowsLeftRight, IconArrowUpRight, IconCreditCardPay } from '@tabler/icons-react';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';

type Visual = {
  icon: ReactNode;
  iconClass: string;
};

const visualFor = (type: TransactionType): Visual => {
  switch (type) {
    case TransactionType.Allocate:
      return {
        icon: <IconArrowUpRight className="size-4" />,
        iconClass: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
      };
    case TransactionType.Spend:
      return {
        icon: <IconCreditCardPay className="size-4" />,
        iconClass: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
      };
    case TransactionType.Deallocate:
      return {
        icon: <IconArrowDownLeft className="size-4" />,
        iconClass: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
      };
    case TransactionType.Transfer:
      return {
        icon: <IconArrowsLeftRight className="size-4" />,
        iconClass: 'bg-slate-500/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-400',
      };
    case TransactionType.Convert:
      return {
        icon: <IconArrowsExchange className="size-4" />,
        iconClass: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
      };
  }
};

const amountClassFor = (type: TransactionType, prefix: RecentActivityPrefix): string => {
  if (type === TransactionType.Deallocate) return 'text-amber-600 dark:text-amber-400';
  if (prefix === '+') return 'text-green-600 dark:text-green-400';
  if (prefix === '-') return 'text-red-600 dark:text-red-400';
  return 'text-foreground';
};

const useRecentTransactions = (currency: Currency): RecentActivityRow[] => {
  const [rows, setRows] = useState<RecentActivityRow[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeRecentTransactions(currency)
      .then(nextRows => { if (!isCancelled) setRows(nextRows); })
      .catch(() => { if (!isCancelled) setRows([]); });
    return () => { isCancelled = true; };
  }, [currency]);

  return rows;
};

const DashboardRecentTransactions = () => {
  const { activeCurrency } = useActiveCurrency();
  const transactions = useRecentTransactions(activeCurrency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 5 transactions in this currency.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href={Routes.UserTransactions}>View all <IconArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">No recent activity in this currency.</p>
        )}
        {transactions.map(transaction => {
          const visual = visualFor(transaction.type);
          const isSoftCancelled = Boolean(transaction.cancelledAt);
          const isReversal = Boolean(transaction.reversalOfID);
          // Reversal entries flip the original sentiment — a reversed Spend
          // (red) returns money so we render it as a positive (green) and
          // vice versa. Soft-cancelled rows drop their sentiment entirely.
          const effectivePrefix = isSoftCancelled
            ? ''
            : isReversal
              ? (transaction.prefix === '+' ? '-' : transaction.prefix === '-' ? '+' : '')
              : transaction.prefix;
          const amountClass = isSoftCancelled
            ? 'text-muted-foreground'
            : amountClassFor(
                transaction.type,
                isReversal
                  ? (transaction.prefix === '+' ? '-' : transaction.prefix === '-' ? '+' : '')
                  : transaction.prefix,
              );
          // Counterparty replaces the original line for cancellation states
          // — Reversed/Reversal carries more useful context here than the
          // original "from X" descriptor.
          const counterparty = transaction.reversedAt
            ? `Reversed ${dateUtil.formatDisplayDate(transaction.reversedAt)}`
            : isReversal
              ? `Reversal · ${transaction.counterparty}`
              : transaction.counterparty;
          const labelSuffix = isSoftCancelled
            ? ` · cancelled`
            : '';
          return (
            <div key={transaction.id} className={cn(
              'flex items-center gap-3',
              isSoftCancelled && 'opacity-90',
            )}>
              <span className={cn('flex items-center justify-center size-9 rounded-full shrink-0', visual.iconClass)}>
                {visual.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {transaction.label}
                  {labelSuffix && <span className="text-muted-foreground font-normal">{labelSuffix}</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{counterparty}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={cn(
                  'text-sm font-medium tabular-nums',
                  amountClass,
                  isSoftCancelled && 'line-through decoration-muted-foreground/60',
                )}>
                  {effectivePrefix}{currencyUtil.format(transaction.amount, transaction.currency)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {dateUtil.formatDisplayDate(transaction.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardRecentTransactions;
