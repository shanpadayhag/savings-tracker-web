import getCachedWallets from '@/features/wallets/api/get-cached-wallets';
import walletListItemModel from '@/features/wallets/models/wallet-list-item-model';
import walletOptionModel from '@/features/wallets/models/wallet-option-model';

const walletRepository = {
  async getWallets() {
    return (await getCachedWallets()).map(walletListItemModel.fromJson);
  },
  async getWalletOptions() {
    return (await getCachedWallets()).map(walletOptionModel.fromJson);
  },
};

export default walletRepository;
