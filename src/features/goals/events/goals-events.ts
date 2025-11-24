import { AppError } from '@/errors/app-error';
import createGoal from '@/features/goals/api/create-goal';
import fetchGoals from '@/features/goals/api/fetch-goals';
import useGoalsStates from "@/features/goals/states/goals-states";
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
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't create the goal. Please try again in a moment." });
    }
  }, [
    states.newGoalName,
    states.newGoalTargetAmount,
    states.newGoalCurrency,
  ]);

  return {
    handleFetchGoals,
    handleCreateGoal,
  };
};

export default useGoalsEvents;
