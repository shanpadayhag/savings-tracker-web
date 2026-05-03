"use client";

// Top-of-fold KPI tiles.
// Surfaces the four headline numbers a user usually wants at a glance: total
// net worth, money sitting in wallets, money committed to goals, and how much
// they spent this month. Each tile shows a percentage delta with an up/down
// arrow so trend direction is readable without parsing numbers.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import Currency from '@/enums/currency';
import { dashboardCurrency, mockSummary } from '@/features/dashboard/data/mock-dashboard-data';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconCoinFilled, IconCreditCardPay, IconTargetArrow, IconTrendingDown, IconTrendingUp, IconWallet } from '@tabler/icons-react';
import { ReactNode } from 'react';

type KpiCardProps = {
  label: string;
  amount: number;
  currency: Currency;
  changePercent: number;
  /** When true, a positive delta is bad (e.g., spending went up) and the
   * arrow color flips. */
  invertSentiment?: boolean;
  icon: ReactNode;
};

const KpiCard = (props: KpiCardProps) => {
  const isPositive = props.changePercent >= 0;
  const isGood = props.invertSentiment ? !isPositive : isPositive;

  return (
    <Card className="gap-2 py-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground font-medium">{props.label}</CardTitle>
          <span className="text-muted-foreground">{props.icon}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className="text-2xl font-semibold tabular-nums">
          {currencyUtil.format(props.amount, props.currency)}
        </span>
        <span className={cn('flex items-center gap-1 text-xs font-medium',
          isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {isPositive
            ? <IconTrendingUp className="size-3.5" />
            : <IconTrendingDown className="size-3.5" />}
          {Math.abs(props.changePercent).toFixed(1)}%
          <span className="text-muted-foreground font-normal">vs last month</span>
        </span>
      </CardContent>
    </Card>
  );
};

const DashboardKpiCards = () => {
  return (
    <div className="grid gap-4 px-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Net Worth"
        amount={mockSummary.netWorth}
        currency={dashboardCurrency}
        changePercent={mockSummary.netWorthChangePercent}
        icon={<IconCoinFilled className="size-4" />} />
      <KpiCard
        label="In Wallets"
        amount={mockSummary.walletsBalance}
        currency={dashboardCurrency}
        changePercent={mockSummary.walletsBalanceChangePercent}
        icon={<IconWallet className="size-4" />} />
      <KpiCard
        label="In Goals"
        amount={mockSummary.goalsBalance}
        currency={dashboardCurrency}
        changePercent={mockSummary.goalsBalanceChangePercent}
        icon={<IconTargetArrow className="size-4" />} />
      <KpiCard
        label="Spent This Month"
        amount={mockSummary.monthlySpend}
        currency={dashboardCurrency}
        changePercent={mockSummary.monthlySpendChangePercent}
        invertSentiment
        icon={<IconCreditCardPay className="size-4" />} />
    </div>
  );
};

export default DashboardKpiCards;
