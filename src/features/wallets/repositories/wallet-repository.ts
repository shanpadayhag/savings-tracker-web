import getWallets from '@/features/wallets/api/get-wallets';
import walletListItemModel from '@/features/wallets/models/wallet-list-item-model';
import walletOptionModel from '@/features/wallets/models/wallet-option-model';

const walletRepository = {
  async getWallets() {
    return (await getWallets()).map(walletListItemModel.fromJson);
  },
  async getWalletOptions() {
    return (await getWallets()).map(walletOptionModel.fromJson);
  },
};

export default walletRepository;
