import appDBUtil from '@/utils/app-db-util';

const getWallets = async () => {
  return appDBUtil.wallets
    .where('deletedAt').equals("null")
    .toArray();
};

export default getWallets;
