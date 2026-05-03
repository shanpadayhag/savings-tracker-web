"use client";

// Insight strip.
// A single, rotating tip drawn from anomaly detection over the user's recent
// activity in the active currency (mocked for now). Sits between the KPI
// tiles and the charts so it catches the eye without competing with them
// for vertical space. Switching currency resets to the first insight so the
// index never overflows the new list.

import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import { dashboardData } from '@/features/dashboard/data/mock-dashboard-data';
import { IconBulb, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useEffect } from 'react';

type DashboardInsightStripProps = {
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
};

const DashboardInsightStrip = (props: DashboardInsightStripProps) => {
  const { activeCurrency } = useActiveCurrency();
  const insights = dashboardData.insights(activeCurrency);

  // Reset to the first insight when the user switches currency so a stale
  // index can't reach past the new list's bounds.
  useEffect(() => {
    props.onReset();
  }, [activeCurrency]);

  if (insights.length === 0) return null;

  const safeIndex = props.index % insights.length;
  const insight = insights[safeIndex];

  return (
    <Card className="mx-4 py-3 px-4 flex-row items-center gap-3 bg-primary/5 border-primary/20">
      <span className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary shrink-0">
        <IconBulb className="size-4" />
      </span>
      <p className="text-sm flex-1 min-w-0">{insight}</p>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={props.onPrev}>
          <IconChevronLeft className="size-4" />
          <span className="sr-only">Previous insight</span>
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {safeIndex + 1} / {insights.length}
        </span>
        <Button variant="ghost" size="icon" className="size-7" onClick={props.onNext}>
          <IconChevronRight className="size-4" />
          <span className="sr-only">Next insight</span>
        </Button>
      </div>
    </Card>
  );
};

export default DashboardInsightStrip;
