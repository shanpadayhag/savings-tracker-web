import { AppError } from '@/errors/app-error';
import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';

type CreateWalletParams = {
  name: Wallet['name'];
  currency: Wallet['currency'];
};

const createWallet = async (params: CreateWalletParams) => {
  if (!params.name) throw new AppError(
    "Oops, No Name! 🤷‍♂️",
    "Your wallet needs a name so we know what to track.");

  const now = new Date();

  appDBUtil.wallets.add({
    id: crypto.randomUUID(),
    userID: 'singleton',
    name: params.name,
    currency: params.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null",
  });
};

export default createWallet;
