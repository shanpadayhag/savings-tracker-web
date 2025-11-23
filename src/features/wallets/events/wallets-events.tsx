import Currency from '@/enums/currency';
import { AppError } from '@/errors/app-error';
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
      states.setNewWalletCurrency(Currency.Euro);

      toast.success("Wallet Created 🎉", {
        description: "Your new wallet is now ready to use."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't create the wallet. Please try again in a moment." });
    }
  }, [states.newWalletName, states.newWalletCurrency]);

  return {
    handleFetchWallets,
    handleCreateWallet,
  };
};

export default useWalletsEvents;
