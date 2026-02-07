import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';

const getWallets = async (): Promise<Wallet[]> => {
  return await appDBUtil.wallets.toArray();
};

export default getWallets;
