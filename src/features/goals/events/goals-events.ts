import { AppError } from '@/errors/app-error';
import createGoal from '@/features/goals/api/create-goal';
import fetchGoals from '@/features/goals/api/fetch-goals';
import useGoalsStates from "@/features/goals/states/goals-states";
import allocateFundToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import walletRepository from '@/features/wallets/repositories/wallet-repository';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useGoalsEvents = (states: ReturnType<typeof useGoalsStates>) => {
  const handleFetchGoals = useCallback(async () => {
    try {
      states.setGoals(await fetchGoals());
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
        sourceID: states.allocationWallet?.value,
        destinationID: states.allocationGoal?.id,
        amount: states.allocationAmount,
        notes: states.allocationNotes,
      });

      handleFetchGoals();
      states.setAllocationDialogIsOpen(false);
      states.setAllocationGoal(undefined);
      states.setAllocationWallet(undefined);
      states.setAllocationNotes("");
      states.setAllocationAmount("");

      toast.success("Goal Funded! 🎯", {
        description: "Successfully moved funds from your wallet to your goal."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't allocate the goal. Please try again in a moment." });
    }
  }, [
    states.allocationWallet,
    states.allocationGoal,
    states.allocationAmount,
    states.allocationNotes,
  ]);

  return {
    handleFetchGoals,
    handleCreateGoal,
    handleFetchWalletOptions,
    handleAllocateFundToGoal,
  };
};

export default useGoalsEvents;
