import Wallet from '@/features/wallets/entities/wallet';
import currency from 'currency.js';

type WalletListItem = {
  id: Wallet['id'];
  name: Wallet['name'];
  currency: Wallet['currency'];
  currentAmount: currency;
  createdAt: Date;
  updatedAt: Date;
};

export default WalletListItem;
