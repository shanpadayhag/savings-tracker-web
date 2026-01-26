import JsonObj from '@/configs/types/json';
import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import currencyUtil from '@/utils/currency-util';

const walletListItemModel = {
  fromJson(json: JsonObj): WalletListItem {
    return {
      id: json.id,
      name: json.name,
      currency: json.currency,
      currentAmount: currencyUtil.parse(
        json.currentAmount,
        json.currency),
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
};

export default walletListItemModel;
