"use client";

// Insight strip.
// A single, rotating tip drawn from anomaly detection over the user's recent
// activity (mocked for now). Sits between the KPI tiles and the charts so it
// catches the eye without competing with them for vertical space.

import { Button } from '@/components/atoms/button';
import { Card } from '@/components/atoms/card';
import { mockInsights } from '@/features/dashboard/data/mock-dashboard-data';
import { IconBulb, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

type DashboardInsightStripProps = {
  index: number;
  onPrev: () => void;
  onNext: () => void;
};

const DashboardInsightStrip = (props: DashboardInsightStripProps) => {
  const insight = mockInsights[props.index];

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
          {props.index + 1} / {mockInsights.length}
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
