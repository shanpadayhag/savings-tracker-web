"use client";

// Headline metrics for the selected reporting window.
// Total income, total spending, savings rate, and net change — these four
// numbers anchor the rest of the page. All values are scoped to the active
// currency; deltas compare against the prior equivalent period in the same
// currency.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeReportsSummary, { ReportsSummary } from '@/features/reports/api/compute-reports-summary';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import { balanceSizeClass } from '@/utils/balance-size';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconCashBanknote, IconCreditCardPay, IconPercentage, IconPigMoney, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { ReactNode, useEffect, useState } from 'react';

const emptySummary: ReportsSummary = {
  totalIncome: 0,
  totalExpense: 0,
  netSaved: 0,
  savingsRate: 0,
  incomeChangePercent: 0,
  expenseChangePercent: 0,
  netChangePercent: 0,
  savingsRateChangePercent: 0,
};

const useReportsSummary = (currency: Currency, range: ReportRange): ReportsSummary => {
  const [summary, setSummary] = useState<ReportsSummary>(emptySummary);

  useEffect(() => {
    let isCancelled = false;
    computeReportsSummary(currency, range)
      .then(next => { if (!isCancelled) setSummary(next); })
      .catch(() => { if (!isCancelled) setSummary(emptySummary); });
    return () => { isCancelled = true; };
  }, [currency, range]);

  return summary;
};

type MetricCardProps = {
  label: string;
  value: string;
  changePercent: number;
  /** When true a positive delta is bad (e.g., spending). */
  invertSentiment?: boolean;
  /** Show "pp" instead of "%" — for changes that are themselves percentages. */
  changeUnit?: '%' | 'pp';
  icon: ReactNode;
};

const MetricCard = (props: MetricCardProps) => {
  const isPositive = props.changePercent >= 0;
  const isGood = props.invertSentiment ? !isPositive : isPositive;
  const unit = props.changeUnit ?? '%';

  return (
    <Card className="gap-2 py-5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground font-medium">{props.label}</CardTitle>
          <span className="text-muted-foreground">{props.icon}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <span className={cn(
          'numeral-hero whitespace-nowrap font-semibold tabular-nums tracking-tight',
          balanceSizeClass(props.value)
        )}>
          {props.value}
        </span>
        <span className={cn('flex items-center gap-1 text-xs font-medium',
          isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {isPositive
            ? <IconTrendingUp className="size-3.5" />
            : <IconTrendingDown className="size-3.5" />}
          {Math.abs(props.changePercent).toFixed(1)}{unit}
          <span className="text-muted-foreground font-normal">vs prior period</span>
        </span>
      </CardContent>
    </Card>
  );
};

type ReportsSummaryCardsProps = {
  range: ReportRange;
};

const ReportsSummaryCards = (props: ReportsSummaryCardsProps) => {
  const { activeCurrency } = useActiveCurrency();
  const summary = useReportsSummary(activeCurrency, props.range);

  return (
    <div className="grid gap-4 px-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total Income"
        value={currencyUtil.format(summary.totalIncome, activeCurrency)}
        changePercent={summary.incomeChangePercent}
        icon={<IconCashBanknote className="size-4" />} />
      <MetricCard
        label="Total Spending"
        value={currencyUtil.format(summary.totalExpense, activeCurrency)}
        changePercent={summary.expenseChangePercent}
        invertSentiment
        icon={<IconCreditCardPay className="size-4" />} />
      <MetricCard
        label="Net Saved"
        value={currencyUtil.format(summary.netSaved, activeCurrency)}
        changePercent={summary.netChangePercent}
        icon={<IconPigMoney className="size-4" />} />
      <MetricCard
        label="Savings Rate"
        value={`${summary.savingsRate.toFixed(1)}%`}
        changePercent={summary.savingsRateChangePercent}
        changeUnit="pp"
        icon={<IconPercentage className="size-4" />} />
    </div>
  );
};

export default ReportsSummaryCards;
