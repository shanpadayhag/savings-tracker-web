import useReportsStates from '@/features/reports/states/reports-states';
import { toast } from 'sonner';
import { useCallback } from 'react';

const useReportsEvents = (_states: ReturnType<typeof useReportsStates>) => {
  // Stub for the export action. Wire this to a CSV / PDF generator once the
  // live aggregations are in place.
  const handleExport = useCallback(() => {
    toast.info('Export coming soon', {
      description: "We'll generate a CSV of this report once data is wired up.",
    });
  }, []);

  return {
    handleExport,
  };
};

export default useReportsEvents;
