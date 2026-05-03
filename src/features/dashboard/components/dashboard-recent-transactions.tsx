"use client";

// Recent activity feed.
// Shows the last few transactions in the active currency with a per-type icon
// and color so the user can scan recent money movement at a glance. Filtering
// by currency keeps the feed coherent — mixing $500 and €410 entries would
// invite false comparisons.

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Routes from '@/enums/routes';
import { DashboardTransaction, dashboardData } from '@/features/dashboard/data/mock-dashboard-data';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';
import { IconArrowDownLeft, IconArrowRight, IconArrowUpRight, IconCreditCardPay } from '@tabler/icons-react';
import Link from 'next/link';
import { ReactNode } from 'react';

type Visual = {
  icon: ReactNode;
  iconClass: string;
  amountClass: string;
  amountPrefix: string;
};

const visualFor = (type: DashboardTransaction['type']): Visual => {
  switch (type) {
    case 'allocate':
      return {
        icon: <IconArrowUpRight className="size-4" />,
        iconClass: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
        amountClass: 'text-green-600 dark:text-green-400',
        amountPrefix: '+',
      };
    case 'spend':
      return {
        icon: <IconCreditCardPay className="size-4" />,
        iconClass: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
        amountClass: 'text-red-600 dark:text-red-400',
        amountPrefix: '-',
      };
    case 'deallocate':
      return {
        icon: <IconArrowDownLeft className="size-4" />,
        iconClass: 'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400',
        amountClass: 'text-amber-600 dark:text-amber-400',
        amountPrefix: '-',
      };
  }
};

const DashboardRecentTransactions = () => {
  const { activeCurrency } = useActiveCurrency();
  const transactions = dashboardData.recentTransactions(activeCurrency);

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
          return (
            <div key={transaction.id} className="flex items-center gap-3">
              <span className={cn('flex items-center justify-center size-9 rounded-full shrink-0', visual.iconClass)}>
                {visual.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transaction.label}</p>
                <p className="text-xs text-muted-foreground truncate">{transaction.counterparty}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className={cn('text-sm font-medium tabular-nums', visual.amountClass)}>
                  {visual.amountPrefix}{currencyUtil.format(transaction.amount, transaction.currency)}
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
