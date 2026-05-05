"use client";

// Top-of-fold KPI tiles.
// Surfaces the four headline numbers a user usually wants at a glance: total
// net worth, money sitting in wallets, money committed to goals, and how much
// they spent this month. Each tile shows a percentage delta with an up/down
// arrow so trend direction is readable without parsing numbers.
//
// All numbers are scoped to the active currency from `useActiveCurrency()` —
// switching currency reflows every tile.

import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeDashboardSummary, { DashboardSummary } from '@/features/dashboard/api/compute-dashboard-summary';
import { balanceSizeClass } from '@/utils/balance-size';
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

type KpiTileProps = {
  label: string;
  amount: number;
  currency: Currency;
  changePercent: number;
  /** When true, a positive delta is bad (e.g., spending went up) and the
   * arrow color flips. */
  invertSentiment?: boolean;
  icon: ReactNode;
  emphasize?: boolean;
};

const KpiTile = (props: KpiTileProps) => {
  const isPositive = props.changePercent >= 0;
  const isGood = props.invertSentiment ? !isPositive : isPositive;
  const formatted = currencyUtil.format(props.amount, props.currency);

  return (
    <div className="group relative flex flex-col gap-3 px-6 py-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-foreground/70">{props.icon}</span>
        <span className="eyebrow !text-muted-foreground">{props.label}</span>
      </div>
      <div className={cn(
        'numeral-hero whitespace-nowrap font-semibold tracking-tight text-foreground',
        balanceSizeClass(formatted, { emphasize: props.emphasize })
      )}>
        {formatted}
      </div>
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium tabular-nums',
        isGood ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
        {isPositive
          ? <IconTrendingUp className="size-3.5" />
          : <IconTrendingDown className="size-3.5" />}
        <span>{Math.abs(props.changePercent).toFixed(1)}%</span>
        <span className="text-muted-foreground font-normal">vs. last month</span>
      </span>
    </div>
  );
};

const DashboardKpiCards = () => {
  const { activeCurrency } = useActiveCurrency();
  const summary = useDashboardSummary(activeCurrency);

  return (
    <div className="px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border bg-card shadow-sm
        divide-y sm:divide-y-0 sm:[&>*:nth-child(2n)]:border-l xl:[&>*:nth-child(2n)]:border-l xl:[&>*:nth-child(3)]:border-l xl:[&>*:nth-child(4)]:border-l
        sm:[&>*:nth-child(3)]:border-t xl:[&>*:nth-child(3)]:border-t-0">
        <KpiTile
          label="Net worth"
          amount={summary.netWorth}
          currency={activeCurrency}
          changePercent={summary.netWorthChangePercent}
          icon={<IconCoinFilled className="size-4" />}
          emphasize />
        <KpiTile
          label="In wallets"
          amount={summary.walletsBalance}
          currency={activeCurrency}
          changePercent={summary.walletsBalanceChangePercent}
          icon={<IconWallet className="size-4" />} />
        <KpiTile
          label="In goals"
          amount={summary.goalsBalance}
          currency={activeCurrency}
          changePercent={summary.goalsBalanceChangePercent}
          icon={<IconTargetArrow className="size-4" />} />
        <KpiTile
          label="Spent this month"
          amount={summary.monthlySpend}
          currency={activeCurrency}
          changePercent={summary.monthlySpendChangePercent}
          invertSentiment
          icon={<IconCreditCardPay className="size-4" />} />
      </div>
    </div>
  );
};

export default DashboardKpiCards;
