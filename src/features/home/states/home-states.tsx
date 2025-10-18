import { ComboboxItems } from '@/components/molecules/combobox';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import User from '@/features/user/entities/user';
import { useState } from 'react';

const useHomeStates = () => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [goalList, setGoalList] = useState<GoalListItem[]>([]);
  const [transactionList, setTransactionList] = useState<TransactionListItem[]>([]);
  const [comboboxGoalItems, setComboboxGoalItems] = useState<ComboboxItems>([]);

  const [createGoalDialogIsOpen, setCreateGoalDialogIsOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");

  const [allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen] = useState(false);
  const [spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalListItem | null>(null);
  const [newTransactionDescription, setNewTransactionDescription] = useState("");
  const [newTransactionAmount, setNewTransactionAmount] = useState("");

  const [resetDialogIsOpen, setResetDialogIsOpen] = useState(false);

  return {
    authUser, setAuthUser,
    goalList, setGoalList,
    transactionList, setTransactionList,
    comboboxGoalItems, setComboboxGoalItems,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen,
    spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen,
    selectedGoal, setSelectedGoal,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionAmount, setNewTransactionAmount,
    resetDialogIsOpen, setResetDialogIsOpen,
  };
};

export default useHomeStates;
