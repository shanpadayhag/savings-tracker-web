import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import allocateFundsToWallet from '@/features/transactions/api/allocate-funds-to-wallet';
import createWallet from '@/features/wallets/api/create-wallet';
import getWallets from '@/features/wallets/api/get-wallets';
import useWalletsStates from '@/features/wallets/states/wallets-states';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useWalletsEvents = (states: ReturnType<typeof useWalletsStates>) => {
  const handleFetchWallets = useCallback(async () => {
    try {
      states.setWallets(await getWallets());
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
        sourceID: states.selectedWallet?.id,
        amount: states.allocateAmount,
      })

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

  return {
    handleFetchWallets,
    handleCreateWallet,
    handleAllocateFundsToWallet,
  };
};

export default useWalletsEvents;
