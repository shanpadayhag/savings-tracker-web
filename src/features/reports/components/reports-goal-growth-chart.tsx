"use client";

// Goal growth stacked area.
// Shows the balance of every active goal over time, stacked so the height of
// the chart at any point equals total money committed to goals. Lets the user
// answer "which goal is contributing most to my growth?" without context-
// switching to the goals page.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { ReportRange, goalSeriesMeta, reportsCurrency, reportsData } from '@/features/reports/data/mock-reports-data';
import currencyUtil from '@/utils/currency-util';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = goalSeriesMeta.reduce<ChartConfig>((config, series) => {
  config[series.key] = { label: series.label, color: series.color };
  return config;
}, {});

type ReportsGoalGrowthChartProps = {
  range: ReportRange;
};

const ReportsGoalGrowthChart = (props: ReportsGoalGrowthChartProps) => {
  const data = useMemo(() => reportsData.goalGrowth(props.range), [props.range]);

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
              tickFormatter={value => currencyUtil.format(value, reportsCurrency)} />
            <ChartTooltip cursor={false} content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {chartConfig[name as string]?.label ?? (name as string)}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {currencyUtil.format(value as number, reportsCurrency)}
                    </span>
                  </div>
                )} />
            } />
            <ChartLegend content={<ChartLegendContent />} />
            {goalSeriesMeta.map(series => (
              <Area key={series.key}
                dataKey={series.key} type="monotone" stackId="goals"
                fill={`var(--color-${series.key})`} fillOpacity={0.6}
                stroke={`var(--color-${series.key})`} strokeWidth={1.5} />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ReportsGoalGrowthChart;
