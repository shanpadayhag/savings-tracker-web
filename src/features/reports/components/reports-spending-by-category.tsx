"use client";

// Spending breakdown donut.
// Splits the period's expenses across mocked categories within the active
// currency. Pairs with the top-categories table to the right, which carries
// the per-category deltas.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeReportsSpendingByCategory, { SpendingByCategory } from '@/features/reports/api/compute-reports-spending-by-category';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--primary)',
  'oklch(0.65 0.15 145)',
  'oklch(0.62 0.14 215)',
];

const useSpendingByCategory = (currency: Currency, range: ReportRange): SpendingByCategory[] => {
  const [data, setData] = useState<SpendingByCategory[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeReportsSpendingByCategory(currency, range)
      .then(next => { if (!isCancelled) setData(next); })
      .catch(() => { if (!isCancelled) setData([]); });
    return () => { isCancelled = true; };
  }, [currency, range]);

  return data;
};

type ReportsSpendingByCategoryProps = {
  range: ReportRange;
};

const ReportsSpendingByCategory = (props: ReportsSpendingByCategoryProps) => {
  const { activeCurrency } = useActiveCurrency();
  const categories = useSpendingByCategory(activeCurrency, props.range);

  const data = useMemo(() =>
    [...categories]
      .sort((a, b) => b.amount - a.amount)
      .map((cat, index) => ({
        ...cat,
        fill: palette[index % palette.length],
      })),
    [categories]);

  const total = useMemo(
    () => data.reduce((sum, cat) => sum + cat.amount, 0),
    [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((cat, index) => {
      config[cat.name] = { label: cat.name, color: palette[index % palette.length] };
    });
    return config;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Where your money went this period.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <PieChart>
              <ChartTooltip cursor={false} content={
                <ChartTooltipContent hideLabel
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name as string}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {currencyUtil.format(value as number, activeCurrency)}
                      </span>
                    </div>
                  )} />
              } />
              <Pie data={data} dataKey="amount" nameKey="name" innerRadius={64} outerRadius={96} strokeWidth={2}>
                {data.map(slice => (<Cell key={slice.name} fill={slice.fill} />))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Total spent</span>
            <span className="text-lg font-semibold tabular-nums">
              {currencyUtil.format(total, activeCurrency)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {data.map(slice => (
            <div key={slice.name} className="flex items-center gap-2 text-xs">
              <span className="size-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: slice.fill }} />
              <span className="truncate flex-1">{slice.name}</span>
              <span className="text-muted-foreground tabular-nums">
                {total === 0 ? '0%' : `${((slice.amount / total) * 100).toFixed(0)}%`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsSpendingByCategory;
