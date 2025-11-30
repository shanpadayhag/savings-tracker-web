import Currency from '@/enums/currency';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import WalletOption from '@/features/wallets/entities/wallet-option';
import { useState } from 'react';

const useGoalsStates = () => {
  const [goals, setGoals] = useState<GoalListItem[]>([]);
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([]);

  const [createGoalDialogIsOpen, setCreateGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrency, setNewGoalCurrency] = useState<Currency>();

  const [allocationDialogIsOpen, setAllocationDialogIsOpen] = useState(false);
  const [allocationGoal, setAllocationGoal] = useState<GoalListItem>();
  const [allocationWallet, setAllocationWallet] = useState<WalletOption>();
  const [allocationNotes, setAllocationNotes] = useState("");
  const [allocationAmount, setAllocationAmount] = useState("");

  return {
    goals, setGoals,
    walletOptions, setWalletOptions,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    newGoalCurrency, setNewGoalCurrency,
    allocationDialogIsOpen, setAllocationDialogIsOpen,
    allocationGoal, setAllocationGoal,
    allocationWallet, setAllocationWallet,
    allocationNotes, setAllocationNotes,
    allocationAmount, setAllocationAmount,
  };
};

export default useGoalsStates;
