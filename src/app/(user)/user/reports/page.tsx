"use client";

import ReportsCashflowChart from '@/features/reports/components/reports-cashflow-chart';
import ReportsGoalGrowthChart from '@/features/reports/components/reports-goal-growth-chart';
import ReportsHeader from '@/features/reports/components/reports-header';
import ReportsSpendingByCategory from '@/features/reports/components/reports-spending-by-category';
import ReportsSpendingHeatmap from '@/features/reports/components/reports-spending-heatmap';
import ReportsSummaryCards from '@/features/reports/components/reports-summary-cards';
import ReportsTopCategoriesTable from '@/features/reports/components/reports-top-categories-table';
import useReportsEvents from '@/features/reports/events/reports-events';
import useReportsStates from '@/features/reports/states/reports-states';

export default () => {
  const states = useReportsStates();
  const events = useReportsEvents(states);

  return (
    <div className="flex flex-col overflow-auto h-full pb-6 gap-6">
      <ReportsHeader
        range={states.range}
        onRangeChange={states.setRange}
        onExport={events.handleExport}
        isExporting={events.isExporting} />

      <ReportsSummaryCards range={states.range} />

      <div className="px-4">
        <ReportsCashflowChart range={states.range} />
      </div>

      <div className="grid gap-4 px-4 grid-cols-1 lg:grid-cols-2">
        <ReportsSpendingByCategory range={states.range} />
        <ReportsTopCategoriesTable range={states.range} />
      </div>

      <div className="px-4">
        <ReportsGoalGrowthChart range={states.range} />
      </div>

      <div className="px-4">
        <ReportsSpendingHeatmap />
      </div>
    </div>
  );
};
