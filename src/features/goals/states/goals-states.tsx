import Currency from '@/enums/currency';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import { useState } from 'react';

const useGoalsStates = () => {
  const [goals, setGoals] = useState<GoalListItem[]>([]);

  const [createGoalDialogIsOpen, setCreateGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState<Currency>();

  return {
    goals, setGoals,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    newGoalCurrency, setNewGoalCurrency,
  };
};

export default useGoalsStates;
