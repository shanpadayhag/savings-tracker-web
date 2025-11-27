import Currency from '@/enums/currency';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import { useState } from 'react';

const useGoalsStates = () => {
  const [goals, setGoals] = useState<GoalListItem[]>([]);

  const [createGoalDialogIsOpen, setCreateGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState<Currency>();

  const [allocationDialogIsOpen, setAllocationDialogIsOpen] = useState(false);
  const [allocationWallet, setAllocationWallet] = useState<undefined>();
  const [allocationDescription, setAllocationDescription] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");

  return {
    goals, setGoals,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    newGoalCurrency, setNewGoalCurrency,
    allocationDialogIsOpen, setAllocationDialogIsOpen,
    allocationWallet, setAllocationWallet,
    allocationDescription, setAllocationDescription,
    allocationAmount, setAllocationAmount,
  };
};

export default useGoalsStates;
