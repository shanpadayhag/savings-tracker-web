"use client";

// Top spending categories table.
// Ranks categories by amount within the active currency and shows the
// per-category change vs. the prior equivalent period — the answer to
// "what got more / less expensive?". Sits next to the donut so the two read
// as a single unit.

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import { useActiveCurrency } from '@/contexts/active-currency-context';
import Currency from '@/enums/currency';
import computeReportsSpendingByCategory, { SpendingByCategory } from '@/features/reports/api/compute-reports-spending-by-category';
import { ReportRange } from '@/features/reports/data/mock-reports-data';
import { cn } from '@/utils/cn';
import currencyUtil from '@/utils/currency-util';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';

const useSpendingByCategory = (currency: Currency, range: ReportRange): SpendingByCategory[] => {
  const [data, setData] = useState<SpendingByCategory[]>([]);

  useEffect(() => {
    let isCancelled = false;
    computeReportsSpendingByCategory(currency, range)
      .then(next => { if (!isCancelled) setData(next); })
      .catch(() => { if (!isCancelled) setData([]); });
    return () => { isCancelled = true; };
  }, [currency, range]);

  return data;
};

type ReportsTopCategoriesTableProps = {
  range: ReportRange;
};

const ReportsTopCategoriesTable = (props: ReportsTopCategoriesTableProps) => {
  const { activeCurrency } = useActiveCurrency();
  const categories = useSpendingByCategory(activeCurrency, props.range);
  const data = useMemo(
    () => [...categories].sort((a, b) => b.amount - a.amount),
    [categories]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Categories</CardTitle>
        <CardDescription>Ranked by spend, with change vs. the prior period.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Txns</TableHead>
              <TableHead className="text-right pr-6">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell className="text-center text-muted-foreground" colSpan={4}>
                  No spending in this currency for this period.
                </TableCell>
              </TableRow>
            )}
            {data.map(category => {
              const isUp = category.changePercent >= 0;
              return (
                <TableRow key={category.name}>
                  <TableCell className="font-medium pl-6">{category.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currencyUtil.format(category.amount, activeCurrency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {category.transactionCount}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums',
                      // Spending: up = bad, down = good.
                      isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                      {isUp
                        ? <IconTrendingUp className="size-3.5" />
                        : <IconTrendingDown className="size-3.5" />}
                      {Math.abs(category.changePercent).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ReportsTopCategoriesTable;
