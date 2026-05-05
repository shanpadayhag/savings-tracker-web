"use client";

// Goal growth stacked area.
// Shows the saved balance of every Active goal in the active currency over
// the selected window, stacked so the height at any point equals total money
// committed to goals in that currency. Series are derived from the user's
// real goals; balances are reconstructed by walking transactions backward
// from each goal's current saved amount.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeReportsGoalGrowth, { GoalGrowthPoint, GoalGrowthSeries } from '@/features/reports/api/compute-reports-goal-growth';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type GoalGrowth = { data: GoalGrowthPoint[]; series: GoalGrowthSeries[]; };

const useGoalGrowth = (currency: Currency, range: ReportRange): GoalGrowth => {
  const [growth, setGrowth] = useState<GoalGrowth>({ data: [], series: [] });

  useEffect(() => {
    let isCancelled = false;
    computeReportsGoalGrowth(currency, range)
      .then(next => { if (!isCancelled) setGrowth(next); })
      .catch(() => { if (!isCancelled) setGrowth({ data: [], series: [] }); });
    return () => { isCancelled = true; };
  }, [currency, range]);

  return growth;
};

type ReportsGoalGrowthChartProps = {
  range: ReportRange;
};

const ReportsGoalGrowthChart = (props: ReportsGoalGrowthChartProps) => {
  const { activeCurrency } = useActiveCurrency();
  const { data, series } = useGoalGrowth(activeCurrency, props.range);

  const chartConfig = useMemo(() => series.reduce<ChartConfig>((config, s) => {
    config[s.key] = { label: s.label, color: s.color };
    return config;
  }, {}), [series]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Growth</CardTitle>
        <CardDescription>How each goal's balance grew over the selected period.</CardDescription>
      </CardHeader>
      <CardContent>
        {series.length === 0
          ? <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No active goals in this currency.
          </div>
          : <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={80}
                tickFormatter={value => currencyUtil.format(value, activeCurrency)} />
              <ChartTooltip cursor={false} content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as string]?.label ?? (name as string)}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {currencyUtil.format(value as number, activeCurrency)}
                      </span>
                    </div>
                  )} />
              } />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map(s => (
                <Area key={s.key}
                  dataKey={s.key} type="monotone" stackId="goals"
                  fill={`var(--color-${s.key})`} fillOpacity={0.6}
                  stroke={`var(--color-${s.key})`} strokeWidth={1.5} />
              ))}
            </AreaChart>
          </ChartContainer>}
      </CardContent>
    </Card>
  );
};

export default ReportsGoalGrowthChart;
