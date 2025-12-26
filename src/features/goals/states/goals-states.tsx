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
  const [spendDialogIsOpen, setSpendDialogIsOpen] = useState(false);
  const [newTransactionGoal, setNewTransactionGoal] = useState<GoalListItem>();
  const [newTransactionWallet, setNewTransactionWallet] = useState<WalletOption>();
  const [newTransactionNotes, setNewTransactionNotes] = useState("");
  const [newTransactionAmount, setNewTransactionAmount] = useState("");

  return {
    goals, setGoals,
    walletOptions, setWalletOptions,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    newGoalCurrency, setNewGoalCurrency,
    allocationDialogIsOpen, setAllocationDialogIsOpen,
    spendDialogIsOpen, setSpendDialogIsOpen,
    newTransactionGoal, setNewTransactionGoal,
    newTransactionWallet, setNewTransactionWallet,
    newTransactionNotes, setNewTransactionNotes,
    newTransactionAmount, setNewTransactionAmount,
  };
};

export default useGoalsStates;
