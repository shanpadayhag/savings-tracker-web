"use client";

// Net worth trend chart.
// Shows the long-term direction of total net worth as a smoothed area chart,
// scoped to the active currency. Range tabs (3M / 6M / 12M / All) reframe
// the time window without leaving the dashboard.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/atoms/tabs';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeNetWorthTrend, { NetWorthPoint } from '@/features/dashboard/api/compute-net-worth-trend';
import { NetWorthRange } from '@/features/dashboard/states/dashboard-states';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const rangeToMonths: Record<NetWorthRange, number> = {
  '3m': 3, '6m': 6, '12m': 12, 'all': Infinity,
};

const chartConfig = {
  netWorth: { label: 'Net Worth', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const useNetWorthTrend = (currency: Currency): NetWorthPoint[] => {
  const [series, setSeries] = useState<NetWorthPoint[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeNetWorthTrend(currency)
      .then(nextSeries => { if (!isCancelled) setSeries(nextSeries); })
      .catch(() => { if (!isCancelled) setSeries([]); });
    return () => { isCancelled = true; };
  }, [currency]);

  return series;
};

type DashboardNetWorthChartProps = {
  range: NetWorthRange;
  onRangeChange: (range: NetWorthRange) => void;
};

const DashboardNetWorthChart = (props: DashboardNetWorthChartProps) => {
  const { activeCurrency } = useActiveCurrency();
  const series = useNetWorthTrend(activeCurrency);

  const data = useMemo(() => {
    const months = rangeToMonths[props.range];
    return months === Infinity ? series : series.slice(-months);
  }, [props.range, series]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle>Net Worth</CardTitle>
            <CardDescription>Wallet balances and goal balances combined.</CardDescription>
          </div>
          <Tabs value={props.range} onValueChange={value => props.onRangeChange(value as NetWorthRange)}>
            <TabsList>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="12m">12M</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id="fillNetWorth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={80}
              tickFormatter={value => currencyUtil.format(value, activeCurrency)} />
            <ChartTooltip cursor={false} content={
              <ChartTooltipContent
                formatter={value => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">Net Worth</span>
                    <span className="font-mono font-medium tabular-nums">
                      {currencyUtil.format(value as number, activeCurrency)}
                    </span>
                  </div>
                )} />
            } />
            <Area dataKey="netWorth" type="natural" fill="url(#fillNetWorth)"
              stroke="var(--color-netWorth)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default DashboardNetWorthChart;
