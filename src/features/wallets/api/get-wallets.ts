import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

const getWallets = async (): Promise<WalletListItem[]> => {
  const walletList = await documentDBUtil.wallet_list
    .reverse().sortBy("updatedAt");

  return walletList.map(walletListItem => ({
    id: walletListItem.id,
    name: walletListItem.name,
    currency: walletListItem.currency,
    currentAmount: currencyUtil.parse(walletListItem.currentAmount, walletListItem.currency),
    createdAt: walletListItem.createdAt,
    updatedAt: walletListItem.updatedAt,
  }));
};

export default getWallets;
