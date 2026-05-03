import { useState } from 'react';

export type NetWorthRange = '3m' | '6m' | '12m' | 'all';

const useDashboardStates = () => {
  const [netWorthRange, setNetWorthRange] = useState<NetWorthRange>('12m');
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  return {
    netWorthRange, setNetWorthRange,
    activeInsightIndex, setActiveInsightIndex,
  };
};

export default useDashboardStates;
