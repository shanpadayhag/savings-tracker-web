"use client";

// Composed cashflow chart.
// Income and expense bars share the axis with a savings-rate line on a
// secondary axis, scoped to the active currency. The user can correlate
// "we earned more" with "we saved more" — or notice when a high-income month
// was wiped out by a high-expense one.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeReportsCashflow, { ReportsCashflowPoint } from '@/features/reports/api/compute-reports-cashflow';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts';

const chartConfig = {
  income: { label: 'Income', color: 'var(--chart-1)' },
  expense: { label: 'Expense', color: 'var(--chart-2)' },
  savingsRate: { label: 'Savings Rate', color: 'var(--primary)' },
} satisfies ChartConfig;

const useReportsCashflow = (currency: Currency, range: ReportRange): ReportsCashflowPoint[] => {
  const [data, setData] = useState<ReportsCashflowPoint[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeReportsCashflow(currency, range)
      .then(next => { if (!isCancelled) setData(next); })
      .catch(() => { if (!isCancelled) setData([]); });
    return () => { isCancelled = true; };
  }, [currency, range]);

  return data;
};

type ReportsCashflowChartProps = {
  range: ReportRange;
};

const ReportsCashflowChart = (props: ReportsCashflowChartProps) => {
  const { activeCurrency } = useActiveCurrency();
  const data = useReportsCashflow(activeCurrency, props.range);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow & Savings Rate</CardTitle>
        <CardDescription>Monthly income vs. expenses with savings rate overlaid.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <ComposedChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis yAxisId="amount" tickLine={false} axisLine={false} tickMargin={8} width={80}
              tickFormatter={value => currencyUtil.format(value, activeCurrency)} />
            <YAxis yAxisId="rate" orientation="right" tickLine={false} axisLine={false} tickMargin={8}
              width={50} domain={[0, 100]} tickFormatter={value => `${value}%`} />
            <ChartTooltip cursor={false} content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground capitalize">
                      {chartConfig[name as keyof typeof chartConfig]?.label ?? (name as string)}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {name === 'savingsRate'
                        ? `${(value as number).toFixed(1)}%`
                        : currencyUtil.format(value as number, activeCurrency)}
                    </span>
                  </div>
                )} />
            } />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="amount" dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="amount" dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
            <Line yAxisId="rate" dataKey="savingsRate" stroke="var(--color-savingsRate)"
              strokeWidth={2} dot={{ r: 3 }} type="monotone" />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ReportsCashflowChart;
