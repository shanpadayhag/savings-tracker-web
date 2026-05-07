import { useActiveCurrency } from '@/contexts/active-currency-context';
import { AppError } from '@/errors/app-error';
import useReportsStates from '@/features/reports/states/reports-states';
import exportReports from '@/features/reports/usecases/export-reports';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const useReportsEvents = (states: ReturnType<typeof useReportsStates>) => {
  const { activeCurrency } = useActiveCurrency();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const filename = await exportReports(activeCurrency, states.range);
      toast.success('Report exported', { description: filename });
    } catch (error) {
      if (error instanceof AppError) {
        toast.error(error.title, { description: error.description });
      } else {
        toast.error('Export failed', {
          description: 'Could not generate the CSV. Please try again.',
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [activeCurrency, states.range, isExporting]);

  return {
    handleExport,
    isExporting,
  };
};

export default useReportsEvents;
