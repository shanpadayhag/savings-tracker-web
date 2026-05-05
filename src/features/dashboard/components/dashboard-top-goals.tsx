"use client";

// Top goals leaderboard.
// Highlights active goals closest to completion within the active currency.
// Each row pairs a progress bar with a forecasted ETA in months — the
// dashboard's value-add over the raw goals page table.

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Progress } from '@/components/atoms/progress';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import Routes from '@/enums/routes';
import computeTopGoals, { TopGoal } from '@/features/dashboard/api/compute-top-goals';
import currencyUtil from '@/utils/currency-util';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const formatEta = (months: number | null) => {
  if (months === null) return 'Pace not yet known';
  if (months === 0) return 'Funded';
  if (months <= 1) return 'About a month left';
  if (months < 12) return `~${months} months left`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `~${years} ${years === 1 ? 'year' : 'years'} left`;
  return `~${years}y ${remaining}m left`;
};

const useTopGoals = (currency: Currency): TopGoal[] => {
  const [goals, setGoals] = useState<TopGoal[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeTopGoals(currency)
      .then(nextGoals => { if (!isCancelled) setGoals(nextGoals); })
      .catch(() => { if (!isCancelled) setGoals([]); });
    return () => { isCancelled = true; };
  }, [currency]);

  return goals;
};

const DashboardTopGoals = () => {
  const { activeCurrency } = useActiveCurrency();
  const sortedGoals = useTopGoals(activeCurrency);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Top Goals</CardTitle>
            <CardDescription>Closest to the finish line.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href={Routes.UserGoals}>View all <IconArrowRight className="size-3.5" /></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sortedGoals.length === 0 && (
          <p className="text-sm text-muted-foreground">No goals in this currency yet.</p>
        )}
        {sortedGoals.map(goal => {
          const percent = Math.min(100, (goal.saved / goal.target) * 100);
          return (
            <div key={goal.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-sm font-medium truncate">{goal.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {currencyUtil.format(goal.saved, goal.currency)}
                  {' / '}
                  {currencyUtil.format(goal.target, goal.currency)}
                </span>
              </div>
              <Progress value={percent} />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{formatEta(goal.etaMonths)}</span>
                <span className="tabular-nums">{percent.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DashboardTopGoals;
