"use client";

// Top-of-fold KPI tiles.
// Surfaces the four headline numbers a user usually wants at a glance: total
// net worth, money sitting in wallets, money committed to goals, and how much
// they spent this month. Each tile shows a percentage delta with an up/down
// arrow so trend direction is readable without parsing numbers.
//
// All numbers are scoped to the active currency from `useActiveCurrency()` —
// switching currency reflows every tile.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeDashboardSummary, { DashboardSummary } from '@/features/dashboard/api/compute-dashboard-summary';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconCoinFilled, IconCreditCardPay, IconTargetArrow, IconTrendingDown, IconTrendingUp, IconWallet } from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';

const emptySummary: DashboardSummary = {
  netWorth: 0, netWorthChangePercent: 0,
  walletsBalance: 0, walletsBalanceChangePercent: 0,
  goalsBalance: 0, goalsBalanceChangePercent: 0,
  monthlySpend: 0, monthlySpendChangePercent: 0,
};

const useDashboardSummary = (currency: Currency): DashboardSummary => {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);

  useEffect(() => {
    let isCancelled = false;
    computeDashboardSummary(currency)
      .then(nextSummary => { if (!isCancelled) setSummary(nextSummary); })
      .catch(() => { if (!isCancelled) setSummary(emptySummary); });
    return () => { isCancelled = true; };
  }, [currency]);

  return summary;
};

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
  const { activeCurrency } = useActiveCurrency();
  const summary = useDashboardSummary(activeCurrency);

  return (
    <div className="grid gap-4 px-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Net Worth"
        amount={summary.netWorth}
        currency={activeCurrency}
        changePercent={summary.netWorthChangePercent}
        icon={<IconCoinFilled className="size-4" />} />
      <KpiCard
        label="In Wallets"
        amount={summary.walletsBalance}
        currency={activeCurrency}
        changePercent={summary.walletsBalanceChangePercent}
        icon={<IconWallet className="size-4" />} />
      <KpiCard
        label="In Goals"
        amount={summary.goalsBalance}
        currency={activeCurrency}
        changePercent={summary.goalsBalanceChangePercent}
        icon={<IconTargetArrow className="size-4" />} />
      <KpiCard
        label="Spent This Month"
        amount={summary.monthlySpend}
        currency={activeCurrency}
        changePercent={summary.monthlySpendChangePercent}
        invertSentiment
        icon={<IconCreditCardPay className="size-4" />} />
    </div>
  );
};

export default DashboardKpiCards;
