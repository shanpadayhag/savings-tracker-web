import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';

type CreateWalletParams = {
  name: Wallet['name'];
  currency: Currency | undefined;
};

const createWallet = async (params: CreateWalletParams): Promise<Wallet['id']> => {
  const walletName = params.name.trim();

  if (!walletName) throw new AppError(
    "Oops, No Name! 🤷‍♂️",
    "Your wallet needs a name so we know what to track.");
  if (!params.currency) throw new AppError(
    "Don't Forget the Currency! 💵",
    "Every wallet needs a currency so we know what type of money it holds. Please select a currency to continue.");

  const walletID = crypto.randomUUID();
  const now = new Date();

  appDBUtil.wallets.add({
    id: walletID,
    name: walletName,
    currency: params.currency,
    createdAt: now,
    updatedAt: now,
    deletedAt: "null",
  });
  documentDBUtil.wallet_list.add({
    id: walletID,
    name: walletName,
    currency: params.currency,
    currentAmount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return walletID;
};

export default createWallet;
