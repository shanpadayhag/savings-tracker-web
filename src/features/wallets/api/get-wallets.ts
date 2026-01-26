import JsonObj from '@/configs/types/json';
import documentDBUtil from '@/utils/document-db-util';

const getWallets = async (): Promise<JsonObj[]> => {
  return documentDBUtil.wallet_list
    .reverse().sortBy("updatedAt");
};

export default getWallets;
