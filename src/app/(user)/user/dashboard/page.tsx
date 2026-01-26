"use client";

import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';

export default () => {
  const states = useDashboardStates();
  const events = useDashboardEvents(states);

  return <>
    <div className="flex flex-col items-center overflow-auto h-full pb-2">
      <div className="w-full flex px-4 py-2">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Dashboard</h1>
      </div>
    </div>
  </>;
};
