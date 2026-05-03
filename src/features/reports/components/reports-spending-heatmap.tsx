"use client";

// Daily spending heatmap.
// GitHub-style 12-week × 7-day grid where cell intensity reflects how much
// was spent that day. Helps spot habits the bar charts don't show — e.g.,
// "I always overspend on weekends" or "every other Friday is a big day".
// The window stays fixed at 12 weeks regardless of the global range so the
// grid stays legible.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { reportsCurrency, reportsData } from '@/features/reports/data/mock-reports-data';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { format } from 'date-fns';
import { useMemo } from 'react';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const intensityClass: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-primary/20',
  2: 'bg-primary/40',
  3: 'bg-primary/60',
  4: 'bg-primary',
};

type Cell =
  | { kind: 'pad' }
  | { kind: 'day'; date: Date; amount: number; intensity: number; };

const ReportsSpendingHeatmap = () => {
  // Pre-compute the grid: pad the start with empty cells so the first day
  // lands on its actual weekday row, then bucket each day's amount into one
  // of five intensity tiers based on the period max.
  const { cells, totals } = useMemo(() => {
    const days = reportsData.heatmap();
    const max = Math.max(...days.map(d => d.amount), 1);

    const intensityFor = (amount: number) => {
      if (amount === 0) return 0;
      const ratio = amount / max;
      if (ratio < 0.25) return 1;
      if (ratio < 0.5) return 2;
      if (ratio < 0.75) return 3;
      return 4;
    };

    const grid: Cell[] = [];
    if (days.length > 0) {
      const startDayOfWeek = days[0].date.getDay();
      for (let i = 0; i < startDayOfWeek; i++) grid.push({ kind: 'pad' });
    }
    days.forEach(day => grid.push({
      kind: 'day',
      date: day.date,
      amount: day.amount,
      intensity: intensityFor(day.amount),
    }));

    const total = days.reduce((sum, d) => sum + d.amount, 0);
    const activeDays = days.filter(d => d.amount > 0).length;
    const dailyAvg = activeDays === 0 ? 0 : total / activeDays;

    return { cells: grid, totals: { total, dailyAvg, activeDays } };
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle>Daily Spending</CardTitle>
            <CardDescription>Last 12 weeks. Darker cells mean a heavier spend day.</CardDescription>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums">
                {currencyUtil.format(totals.total, reportsCurrency)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">Avg / active day</span>
              <span className="font-medium tabular-nums">
                {currencyUtil.format(totals.dailyAvg, reportsCurrency)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto">
          <div className="flex flex-col justify-around text-[10px] text-muted-foreground py-0.5">
            {dayLabels.map(label => <span key={label} className="h-3 leading-3">{label}</span>)}
          </div>
          <div className="grid grid-rows-7 grid-flow-col gap-1 auto-cols-min">
            {cells.map((cell, index) => cell.kind === 'pad'
              ? <div key={`pad-${index}`} className="size-3" />
              : <div
                key={cell.date.toISOString()}
                className={cn('size-3 rounded-sm transition-colors hover:ring-1 hover:ring-foreground/40',
                  intensityClass[cell.intensity])}
                title={`${format(cell.date, 'EEE, MMM d')} — ${cell.amount === 0
                  ? 'no spend'
                  : currencyUtil.format(cell.amount, reportsCurrency)}`} />)}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className={cn('size-3 rounded-sm', intensityClass[level])} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsSpendingHeatmap;
