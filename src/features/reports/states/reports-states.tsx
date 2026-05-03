import { ReportRange } from '@/features/reports/data/mock-reports-data';
import { useState } from 'react';

const useReportsStates = () => {
  // The global range filter — every chart on the page reads from this so the
  // user can refit the whole report with one click.
  const [range, setRange] = useState<ReportRange>('6m');

  return {
    range, setRange,
  };
};

export default useReportsStates;
