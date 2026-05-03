"use client";

// Monthly cashflow comparison.
// Side-by-side income vs. expense bars per month so the user can spot
// over-spend months at a glance. The footer surfaces the average net cashflow
// to give the bars a single-number summary.

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { dashboardCurrency, mockCashflow } from '@/features/dashboard/data/mock-dashboard-data';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  income: { label: 'Income', color: 'var(--chart-1)' },
  expense: { label: 'Expense', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const DashboardCashflowChart = () => {
  const averageNet = useMemo(() => {
    const total = mockCashflow.reduce((sum, m) => sum + (m.income - m.expense), 0);
    return total / mockCashflow.length;
  }, []);

  const isPositive = averageNet >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow</CardTitle>
        <CardDescription>Income vs. expenses over the last 6 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={mockCashflow} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={80}
              tickFormatter={value => currencyUtil.format(value, dashboardCurrency)} />
            <ChartTooltip cursor={false} content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground capitalize">{name as string}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {currencyUtil.format(value as number, dashboardCurrency)}
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
          Avg. net {isPositive ? '+' : '-'}{currencyUtil.format(Math.abs(averageNet), dashboardCurrency)} / mo
        </span>
      </CardFooter>
    </Card>
  );
};

export default DashboardCashflowChart;
