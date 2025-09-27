import { currencyUtil } from '@/utils/currency-util';

type HomeDialogCurrentBalanceProps = {
  totalAvailableFunds: number | undefined;
};

const HomeDialogCurrentBalance = ({ totalAvailableFunds }: HomeDialogCurrentBalanceProps) => {
  return <div className="flex flex-col items-center">
    <p className="text-xs text-muted-foreground">Current Balance:</p>
    <h3 className="text-2xl font-semibold">{currencyUtil.format(totalAvailableFunds || 0)}</h3>
  </div>;
};

export default HomeDialogCurrentBalance;
