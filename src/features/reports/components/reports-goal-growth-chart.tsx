"use client";

// Goal growth stacked area.
// Shows the balance of every goal (in the active currency) over time, stacked
// so the height at any point equals total money committed to goals in that
// currency. The series list comes from the mocks per currency, since the
// goals themselves differ across currencies.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import { ReportRange, reportsData } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

type ReportsGoalGrowthChartProps = {
  range: ReportRange;
};

const ReportsGoalGrowthChart = (props: ReportsGoalGrowthChartProps) => {
  const { activeCurrency } = useActiveCurrency();

  const data = useMemo(
    () => reportsData.goalGrowth(activeCurrency, props.range),
    [activeCurrency, props.range]);

  const series = useMemo(
    () => reportsData.goalSeriesMeta(activeCurrency),
    [activeCurrency]);

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
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ReportsGoalGrowthChart;
