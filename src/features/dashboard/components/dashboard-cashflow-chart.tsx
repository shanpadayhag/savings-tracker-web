"use client";

// Monthly cashflow comparison.
// Side-by-side income vs. expense bars per month for the active currency, so
// the user can spot over-spend months at a glance. The footer surfaces the
// average net cashflow to give the bars a single-number summary.

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeCashflow, { CashflowPoint } from '@/features/dashboard/api/compute-cashflow';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  income: { label: 'Income', color: 'var(--chart-1)' },
  expense: { label: 'Expense', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const useCashflow = (currency: Currency): CashflowPoint[] => {
  const [points, setPoints] = useState<CashflowPoint[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeCashflow(currency)
      .then(nextPoints => { if (!isCancelled) setPoints(nextPoints); })
      .catch(() => { if (!isCancelled) setPoints([]); });
    return () => { isCancelled = true; };
  }, [currency]);

  return points;
};

const DashboardCashflowChart = () => {
  const { activeCurrency } = useActiveCurrency();
  const data = useCashflow(activeCurrency);

  const averageNet = useMemo(() => {
    if (data.length === 0) return 0;
    const total = data.reduce((sum, m) => sum + (m.income - m.expense), 0);
    return total / data.length;
  }, [data]);

  const isPositive = averageNet >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow</CardTitle>
        <CardDescription>Income vs. expenses over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={80}
              tickFormatter={value => currencyUtil.format(value, activeCurrency)} />
            <ChartTooltip cursor={false} content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground capitalize">{name as string}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {currencyUtil.format(value as number, activeCurrency)}
                    </span>
                  </div>
                )} />
            } />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm">
        <span className={cn('flex items-center gap-1.5 font-medium',
          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {isPositive
            ? <IconTrendingUp className="size-4" />
            : <IconTrendingDown className="size-4" />}
          Avg. net {isPositive ? '+' : '-'}{currencyUtil.format(Math.abs(averageNet), activeCurrency)} / mo
        </span>
      </CardFooter>
    </Card>
  );
};

export default DashboardCashflowChart;
