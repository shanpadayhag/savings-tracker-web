"use client";

// Page header for the reports view.
// Hosts the title/subtitle on the left and the global controls on the right
// (currency switcher + date-range presets + export). The range and currency
// here drive every other component on the page.

import { Button } from '@/components/atoms/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/atoms/toggle-group';
import CurrencySwitcher from '@/components/molecules/currency-switcher';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import { IconDownload } from '@tabler/icons-react';

type ReportsHeaderProps = {
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
  onExport: () => void;
};

const ReportsHeader = (props: ReportsHeaderProps) => {
  return (
    <div className="w-full px-4 pt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow">Insights</p>
        <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Reports</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visualize your savings and spending patterns to spot trends over time.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CurrencySwitcher />

        <ToggleGroup type="single" variant="outline" size="sm" value={props.range}
          onValueChange={value => { if (value) props.onRangeChange(value as ReportRange); }}>
          <ToggleGroupItem value="1m">1M</ToggleGroupItem>
          <ToggleGroupItem value="3m">3M</ToggleGroupItem>
          <ToggleGroupItem value="6m">6M</ToggleGroupItem>
          <ToggleGroupItem value="12m">12M</ToggleGroupItem>
        </ToggleGroup>

        <Button size="sm" variant="outline" onClick={props.onExport}>
          <IconDownload className="size-4" /> Export
        </Button>
      </div>
    </div>
  );
};

export default ReportsHeader;
