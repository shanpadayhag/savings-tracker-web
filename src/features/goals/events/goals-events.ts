import { AppError } from '@/errors/app-error';
import archiveGoal from '@/features/goals/api/archive-goal';
import createGoal from '@/features/goals/api/create-goal';
import getCachedGoals from '@/features/goals/api/get-cached-goals';
import useGoalsStates from "@/features/goals/states/goals-states";
import allocateFundToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import spendFundsFromGoal from '@/features/transactions/usecases/spend-funds-from-goal';
import walletRepository from '@/features/wallets/repositories/wallet-repository';
import useAppCallback from '@/hooks/use-app-callback';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useGoalsEvents = (states: ReturnType<typeof useGoalsStates>) => {
  const handleFetchGoals = useCallback(async () => {
    try {
      states.setGoals(await getCachedGoals());
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
    }
  }, []);

  const handleCreateGoal = useCallback(async () => {
    try {
      await createGoal({
        name: states.newGoalName,
        targetAmount: states.newGoalTargetAmount,
        currency: states.newGoalCurrency
      });

      handleFetchGoals();
      states.setCreateGoalDialogIsOpen(false);

      toast.success("Goal Funded! 🎯", {
        description: "Successfully moved funds from your wallet to your goal."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't create the goal. Please try again in a moment." });
    }
  }, [
    states.newGoalName,
    states.newGoalTargetAmount,
    states.newGoalCurrency,
  ]);

  const handleFetchWalletOptions = useCallback(async () => {
    try {
      states.setWalletOptions(await walletRepository.getWalletOptions());
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't fetch the wallet options. Please try again in a moment." });
    }
  }, []);

  const handleAllocateFundToGoal = useCallback(async () => {
    try {
      await allocateFundToGoal({
        sourceID: states.newTransactionWallet?.value,
        destinationID: states.newTransactionGoal?.id,
        amount: states.newTransactionAmount,
        notes: states.newTransactionNotes,
      });

      handleFetchGoals();
      handleFetchWalletOptions();
      states.setAllocationDialogIsOpen(false);
      states.setNewTransactionGoal(undefined);
      states.setNewTransactionWallet(undefined);
      states.setNewTransactionNotes("");
      states.setNewTransactionAmount("");

      toast.success("Goal Funded! 🎯", {
        description: "Successfully moved funds from your wallet to your goal."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't allocate the goal. Please try again in a moment." });
    }
  }, [
    states.newTransactionWallet,
    states.newTransactionGoal,
    states.newTransactionAmount,
    states.newTransactionNotes,
  ]);

  const handleSpendFundsFromGoal = useAppCallback(async () => {
    await spendFundsFromGoal({
      goalID: states.newTransactionGoal?.id,
      notes: states.newTransactionNotes,
      amount: states.newTransactionAmount,
    });

    handleFetchGoals();
    states.setSpendDialogIsOpen(false);
    states.setNewTransactionGoal(undefined);
    states.setNewTransactionWallet(undefined);
    states.setNewTransactionNotes("");
    states.setNewTransactionAmount("");

    toast.success("Transaction Complete ✅", {
      description: "We successfully deducted the amount from your selected goal."
    });
  }, [
    states.newTransactionGoal,
    states.newTransactionNotes,
    states.newTransactionAmount,
  ]);

  const handleArchiveGoal = useAppCallback(async () => {
    await archiveGoal({
      goalID: states.newTransactionGoal?.id,
      walletID: states.newTransactionWallet?.value,
    });

    handleFetchGoals();
    handleFetchWalletOptions();
    states.setArchiveDialogIsOpen(false);
    states.setNewTransactionGoal(undefined);
    states.setNewTransactionWallet(undefined);

    toast.success("Goal Archived 📦", {
      description: "We returned the goal's balance to your wallet and archived the goal."
    });
  }, [
    states.newTransactionGoal,
    states.newTransactionWallet,
  ]);

  return {
    handleFetchGoals,
    handleCreateGoal,
    handleFetchWalletOptions,
    handleAllocateFundToGoal,
    handleSpendFundsFromGoal,
    handleArchiveGoal,
  };
};

export default useGoalsEvents;
