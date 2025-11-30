import WalletOption from '@/features/wallets/entities/wallet-option';
import currencyUtil from '@/utils/currency-util';

const walletOptionModel = {
  fromJson(json: Record<string, any>): WalletOption {
    return {
      value: json.id,
      label: json.name,
      data: {
        currentAmount: currencyUtil.parse(
          json.currentAmount,
          json.currency),
      }
    };
  },
};

export default walletOptionModel;
