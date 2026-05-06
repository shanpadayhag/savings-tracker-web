import { AppError } from '@/errors/app-error';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import Category from '@/features/categories/entities/category';
import Transaction from '@/features/transactions/entities/transaction';
import TransactionDirection from '@/features/transactions/enums/transaction-direction';
import TransactionSourceType from '@/features/transactions/enums/transaction-source-type';
import TransactionType from '@/features/transactions/enums/transaction-type';
import Wallet from '@/features/wallets/entities/wallet';
import appDBUtil from '@/utils/app-db-util';
import currencyUtil from '@/utils/currency-util';
import documentDBUtil from '@/utils/document-db-util';

type SpendFundsFromWalletParams = {
  walletID?: Wallet['id'];
  notes: Transaction['notes'];
  amount: string;
  categoryID?: Category['id'];
  createdAt?: Date;
};

const spendFundsFromWallet = async (params: SpendFundsFromWalletParams) => {
  const wallet = await documentDBUtil.wallet_list.get(params.walletID || "");
  if (!wallet || !params.walletID) throw new AppError(
    "Hmm, Wallet Not Found... 🧐",
    "We couldn't find this wallet. It may have been deleted. Please try refreshing your list.");

  const paramsAmount = currencyUtil.parse(params.amount, wallet.currency);
  if (paramsAmount.value <= 0) throw new AppError(
    "Log Your Spending 💸",
    "Please enter an amount greater than zero to track this expense.");

  const walletCurrentAmount = currencyUtil.parse(wallet.currentAmount, wallet.currency);
  const newCurrentAmount = walletCurrentAmount.subtract(paramsAmount);
  if (newCurrentAmount.value < 0) throw new AppError(
    "Wallet is a Little Short 🤏",
    "This wallet doesn't have enough funds to cover this expense. Please adjust the amount or allocate more funds first.");

  const fallbackCategory = await ensureDefaultCategory();
  const pickedCategory = params.categoryID
    ? await appDBUtil.categories.get(params.categoryID)
    : null;
  const category = pickedCategory && pickedCategory.deletedAt === 'null'
    ? pickedCategory
    : fallbackCategory;

  const transaction = {
    id: crypto.randomUUID(),
    type: TransactionType.Spend,
    notes: params.notes?.trim() || null,
    categoryID: category.id,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry1 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.Wallet,
    sourceID: wallet.id,
    direction: TransactionDirection.From,
    amount: paramsAmount.value,
    currency: wallet.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };
  const transactionEntry2 = {
    id: crypto.randomUUID(),
    transactionID: transaction.id,
    sourceType: TransactionSourceType.External,
    sourceID: null,
    direction: TransactionDirection.To,
    amount: paramsAmount.value,
    currency: wallet.currency,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
  };

  await appDBUtil.transactions.add(transaction);
  await appDBUtil.transaction_entries.add(transactionEntry1);
  await appDBUtil.transaction_entries.add(transactionEntry2);

  await documentDBUtil.transaction_list.add({
    id: transaction.id,
    type: transaction.type,
    notes: transaction.notes,
    entries: [{
      type: transactionEntry1.sourceType,
      sourceID: transactionEntry1.sourceID,
      name: wallet.name,
      currency: wallet.currency,
      direction: transactionEntry1.direction,
      amount: transactionEntry1.amount,
    }, {
      type: transactionEntry2.sourceType,
      sourceID: transactionEntry2.sourceID,
      name: null,
      currency: wallet.currency,
      direction: transactionEntry2.direction,
      amount: transactionEntry2.amount,
    }],
    categoryID: category.id,
    categoryName: category.name,
    categoryColor: category.color,
    createdAt: params.createdAt,
    updatedAt: params.createdAt,
    reversedCreatedAt: params?.createdAt
      ? params.createdAt.getTime() * -1
      : undefined
  });

  await documentDBUtil.wallet_list.update(wallet.id, {
    currentAmount: newCurrentAmount.value,
  });
};

export default spendFundsFromWallet;
