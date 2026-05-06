import { useActiveCurrency } from '@/contexts/active-currency-context';
import { AppError } from '@/errors/app-error';
import allocateFundsToWallet from '@/features/transactions/api/allocate-funds-to-wallet';
import convertFundsBetweenWallets from '@/features/transactions/api/convert-funds-between-wallets';
import transferFundsBetweenWallets from '@/features/transactions/api/transfer-funds-between-wallets';
import deallocateFundsFromWallet from '@/features/transactions/usecases/deallocate-funds-from-wallet';
import spendFundsFromWallet from '@/features/transactions/usecases/spend-funds-from-wallet';
import createWallet from '@/features/wallets/api/create-wallet';
import walletRepository from '@/features/wallets/repositories/wallet-repository';
import useWalletsStates from '@/features/wallets/states/wallets-states';
import useAppCallback from '@/hooks/use-app-callback';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useWalletsEvents = (states: ReturnType<typeof useWalletsStates>) => {
  const { refreshAvailable } = useActiveCurrency();
  const handleFetchWallets = useCallback(async () => {
    try {
      states.setWallets(await walletRepository.getWallets());
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
    }
  }, []);

  const handleCreateWallet = useCallback(async () => {
    try {
      await createWallet({
        name: states.newWalletName,
        currency: states.newWalletCurrency,
      });

      handleFetchWallets();
      refreshAvailable();
      states.setCreateWalletDialogIsOpen(false);
      states.setNewWalletName("");
      states.setNewWalletCurrency(undefined);

      toast.success("Wallet Created 🎉", {
        description: "Your new wallet is now ready to use."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't create the wallet. Please try again in a moment." });
    }
  }, [states.newWalletName, states.newWalletCurrency]);

  const handleAllocateFundsToWallet = useCallback(async () => {
    try {
      await allocateFundsToWallet({
        walletID: states.selectedWallet?.id,
        amount: states.allocateAmount,
      });

      handleFetchWallets();
      states.setAllocateDialogIsOpen(false);
      states.setSelectedWallet(undefined);
      states.setAllocateAmount("");

      toast.success("Funds Added! 💸", {
        description: "The new funds are now available in your wallet."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't allocated fund to the wallet. Please try again in a moment." });
    }
  }, [states.allocateAmount, states.selectedWallet]);

  const handleConvertFundsBetweenWallets = useAppCallback(async () => {
    await convertFundsBetweenWallets({
      sourceID: states.selectedWallet?.id,
      destinationID: states.convertDestinationWallet?.id,
      amountSent: states.convertAmountSent,
      fee: states.convertFee,
      amountReceived: states.convertAmountReceived,
      notes: states.convertNotes,
    });

    handleFetchWallets();
    states.setConvertDialogIsOpen(false);
    states.setSelectedWallet(undefined);
    states.setConvertDestinationWallet(undefined);
    states.setConvertAmountSent("");
    states.setConvertFee("");
    states.setConvertAmountReceived("");
    states.setConvertNotes("");

    toast.success("Conversion Complete 💱", {
      description: "We moved the converted funds into your destination wallet."
    });
  }, [
    states.selectedWallet,
    states.convertDestinationWallet,
    states.convertAmountSent,
    states.convertFee,
    states.convertAmountReceived,
    states.convertNotes,
  ]);

  const handleTransferFundsBetweenWallets = useAppCallback(async () => {
    await transferFundsBetweenWallets({
      sourceID: states.selectedWallet?.id,
      destinationID: states.transferDestinationWallet?.id,
      amount: states.transferAmount,
      fee: states.transferFee,
      notes: states.transferNotes,
    });

    handleFetchWallets();
    states.setTransferDialogIsOpen(false);
    states.setSelectedWallet(undefined);
    states.setTransferDestinationWallet(undefined);
    states.setTransferAmount("");
    states.setTransferFee("");
    states.setTransferNotes("");

    toast.success("Transfer Complete 🏦", {
      description: "We moved the funds into your destination wallet."
    });
  }, [
    states.selectedWallet,
    states.transferDestinationWallet,
    states.transferAmount,
    states.transferFee,
    states.transferNotes,
  ]);

  const handleSpendFundsFromWallet = useAppCallback(async () => {
    await spendFundsFromWallet({
      walletID: states.selectedWallet?.id,
      amount: states.spendAmount,
      categoryID: states.spendCategory?.value,
      notes: states.spendNotes,
    });

    handleFetchWallets();
    states.setSpendDialogIsOpen(false);
    states.setSelectedWallet(undefined);
    states.setSpendAmount("");
    states.setSpendCategory(undefined);
    states.setSpendNotes("");

    toast.success("Spend Recorded ✅", {
      description: "We deducted the amount from your wallet."
    });
  }, [
    states.selectedWallet,
    states.spendAmount,
    states.spendCategory,
    states.spendNotes,
  ]);

  const handleDeallocateFundsFromWallet = useAppCallback(async () => {
    await deallocateFundsFromWallet({
      walletID: states.selectedWallet?.id,
      amount: states.defundAmount,
      notes: states.defundNotes,
    });

    handleFetchWallets();
    states.setDefundDialogIsOpen(false);
    states.setSelectedWallet(undefined);
    states.setDefundAmount("");
    states.setDefundNotes("");

    toast.success("Refund Recorded ↩️", {
      description: "We deducted the refunded amount from your wallet."
    });
  }, [
    states.selectedWallet,
    states.defundAmount,
    states.defundNotes,
  ]);

  return {
    handleFetchWallets,
    handleCreateWallet,
    handleAllocateFundsToWallet,
    handleConvertFundsBetweenWallets,
    handleTransferFundsBetweenWallets,
    handleSpendFundsFromWallet,
    handleDeallocateFundsFromWallet,
  };
};

export default useWalletsEvents;
