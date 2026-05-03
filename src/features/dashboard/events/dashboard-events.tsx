import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import { useCallback } from 'react';

const useDashboardEvents = (states: ReturnType<typeof useDashboardStates>) => {
  // Insight navigation. The insight count varies per currency, so we just
  // step the index forward/back; the strip itself takes care of clamping
  // against the active currency's insight list.
  const handleNextInsight = useCallback(() => {
    states.setActiveInsightIndex(prev => prev + 1);
  }, []);

  const handlePrevInsight = useCallback(() => {
    states.setActiveInsightIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleResetInsight = useCallback(() => {
    states.setActiveInsightIndex(0);
  }, []);

  return {
    handleNextInsight,
    handlePrevInsight,
    handleResetInsight,
  };
};

export default useDashboardEvents;
