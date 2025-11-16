import Currency from '@/enums/currency';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import currencyUtil from '@/utils/currency-util';

export type DashboardDialogCurrentBalanceProps = {
  authUser: ReturnType<typeof useDashboardStates>['authUser'];
  currentBalance: number | undefined;
};

const DashboardDialogCurrentBalance = (props: DashboardDialogCurrentBalanceProps) => {
  return <div className="flex flex-col items-center">
    <p className="text-xs text-muted-foreground">Current Balance:</p>
    <h3 className="text-2xl font-semibold">
      {currencyUtil.format(
        props.currentBalance || 0,
        props.authUser?.financialSummary.currency || Currency.Euro)}
    </h3>
  </div>;
};

export default DashboardDialogCurrentBalance;
