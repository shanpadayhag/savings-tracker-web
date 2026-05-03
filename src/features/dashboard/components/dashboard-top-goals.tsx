"use client";

// Top goals leaderboard.
// Highlights the active goals closest to completion so the user sees their
// near-term wins. Each row pairs a progress bar with a forecasted ETA in
// months — the dashboard's value-add over the raw goals page table.

import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Progress } from '@/components/atoms/progress';
import Routes from '@/enums/routes';
import { mockTopGoals } from '@/features/dashboard/data/mock-dashboard-data';
import currencyUtil from '@/utils/currency-util';
import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { useMemo } from 'react';

const formatEta = (months: number) => {
  if (months <= 1) return 'About a month left';
  if (months < 12) return `~${months} months left`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `~${years} ${years === 1 ? 'year' : 'years'} left`;
  return `~${years}y ${remaining}m left`;
};

const DashboardTopGoals = () => {
  // Sort by progress descending so the goals nearest the finish line surface
  // first — that's the motivating view, not a flat list.
  const sortedGoals = useMemo(() => {
    return [...mockTopGoals].sort((a, b) =>
      (b.saved / b.target) - (a.saved / a.target));
  }, []);

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
