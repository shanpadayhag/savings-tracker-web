import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';

const getWallets = async (): Promise<Wallet[]> => {
  return appDBUtil.wallets.toArray();
};

export default getWallets;
