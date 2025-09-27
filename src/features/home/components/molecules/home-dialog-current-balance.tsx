import { currencyUtil } from '@/utils/currency-util';

export type HomeDialogCurrentBalanceProps = {
  currentBalance: number | undefined;
};

const HomeDialogCurrentBalance = ({ currentBalance }: HomeDialogCurrentBalanceProps) => {
  return <div className="flex flex-col items-center">
    <p className="text-xs text-muted-foreground">Current Balance:</p>
    <h3 className="text-2xl font-semibold">{currencyUtil.format(currentBalance || 0)}</h3>
  </div>;
};

export default HomeDialogCurrentBalance;
