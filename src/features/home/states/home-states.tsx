import { ComboboxItems } from '@/components/molecules/combobox';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import { useState } from 'react';

const useHomeStates = () => {
  const [goalList, setGoalList] = useState<GoalListItem[]>([]);
  const [comboboxGoalItems, setComboboxGoalItems] = useState<ComboboxItems>([]);

  const [newTransactionDescription, setNewTransactionDescription] = useState("");
  const [newTransactionAmount, setNewTransactionAmount] = useState("");

  const [selectedGoal, setSelectedGoal] = useState<{ id: string; name: string; }>();
  const [allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen] = useState(false);
  const [spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen] = useState(false);

  return {
    goalList, setGoalList,
    comboboxGoalItems, setComboboxGoalItems,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionAmount, setNewTransactionAmount,
    selectedGoal, setSelectedGoal,
    allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen,
    spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen,
  };
};

export default useHomeStates;
