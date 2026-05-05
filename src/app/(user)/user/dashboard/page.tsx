"use client";

import { useCurrentUser } from '@/contexts/current-user-context';
import DashboardAllocationChart from '@/features/dashboard/components/dashboard-allocation-chart';
import DashboardCashflowChart from '@/features/dashboard/components/dashboard-cashflow-chart';
import DashboardGreeting from '@/features/dashboard/components/dashboard-greeting';
import DashboardInsightStrip from '@/features/dashboard/components/dashboard-insight-strip';
import DashboardKpiCards from '@/features/dashboard/components/dashboard-kpi-cards';
import DashboardNetWorthChart from '@/features/dashboard/components/dashboard-net-worth-chart';
import DashboardRecentTransactions from '@/features/dashboard/components/dashboard-recent-transactions';
import DashboardTopGoals from '@/features/dashboard/components/dashboard-top-goals';
import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';

export default () => {
  const states = useDashboardStates();
  const events = useDashboardEvents(states);
  const { firstName } = useCurrentUser();

  return (
    <div className="flex flex-col overflow-auto h-full pb-6 gap-6">
      <DashboardGreeting name={firstName} />

      <DashboardKpiCards />

      <DashboardInsightStrip
        index={states.activeInsightIndex}
        onPrev={events.handlePrevInsight}
        onNext={events.handleNextInsight}
        onReset={events.handleResetInsight} />

      <div className="grid gap-4 px-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardNetWorthChart
            range={states.netWorthRange}
            onRangeChange={states.setNetWorthRange} />
        </div>
        <div className="lg:col-span-1">
          <DashboardAllocationChart />
        </div>
      </div>

      <div className="grid gap-4 px-4 grid-cols-1 lg:grid-cols-2">
        <DashboardTopGoals />
        <DashboardRecentTransactions />
      </div>

      <div className="px-4">
        <DashboardCashflowChart />
      </div>
    </div>
  );
};
