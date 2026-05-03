import { mockInsights } from '@/features/dashboard/data/mock-dashboard-data';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import { useCallback } from 'react';

const useDashboardEvents = (states: ReturnType<typeof useDashboardStates>) => {
  const handleNextInsight = useCallback(() => {
    states.setActiveInsightIndex(prev => (prev + 1) % mockInsights.length);
  }, []);

  const handlePrevInsight = useCallback(() => {
    states.setActiveInsightIndex(prev => (prev - 1 + mockInsights.length) % mockInsights.length);
  }, []);

  return {
    handleNextInsight,
    handlePrevInsight,
  };
};

export default useDashboardEvents;
