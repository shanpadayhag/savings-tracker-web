"use client";

// Allocation breakdown donut.
// Answers "where is my money right now?" by splitting net worth across each
// goal and wallet — within the active currency. The center label shows the
// total so the chart doubles as a summary tile. Cross-currency comparison
// would be misleading, so this view is always single-currency.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/atoms/chart';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import { dashboardData } from '@/features/dashboard/data/mock-dashboard-data';
import currencyUtil from '@/utils/currency-util';
import { useMemo } from 'react';
import { Cell, Pie, PieChart } from 'recharts';

const palette = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--primary)',
];

const DashboardAllocationChart = () => {
  const { activeCurrency } = useActiveCurrency();

  const data = useMemo(() => {
    const slices = dashboardData.allocation(activeCurrency);
    return slices.map((slice, index) => ({
      ...slice,
      fill: palette[index % palette.length],
    }));
  }, [activeCurrency]);

  const total = useMemo(
    () => data.reduce((sum, slice) => sum + slice.amount, 0),
    [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    data.forEach((slice, index) => {
      config[slice.name] = { label: slice.name, color: palette[index % palette.length] };
    });
    return config;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where Your Money Lives</CardTitle>
        <CardDescription>Allocation across goals and wallets.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
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
              <Pie data={data} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={90} strokeWidth={2}>
                {data.map(slice => (<Cell key={slice.name} fill={slice.fill} />))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted-foreground">Total</span>
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

export default DashboardAllocationChart;
