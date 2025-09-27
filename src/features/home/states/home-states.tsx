import { ComboboxItems } from '@/components/molecules/combobox';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import { useState } from 'react';

const useHomeStates = () => {
  const [goalList, setGoalList] = useState<GoalListItem[]>([]);
  const [comboboxGoalItems, setComboboxGoalItems] = useState<ComboboxItems>([]);

  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");

  const [selectedGoal, setSelectedGoal] = useState<GoalListItem | null>(null);
  const [newTransactionDescription, setNewTransactionDescription] = useState("");
  const [newTransactionAmount, setNewTransactionAmount] = useState("");

  const [createGoalDialogIsOpen, setCreateGoalDialogIsOpen] = useState(false);
  const [allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen] = useState(false);
  const [spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen] = useState(false);

  return {
    goalList, setGoalList,
    comboboxGoalItems, setComboboxGoalItems,
    newGoalName, setNewGoalName,
    newGoalTargetAmount, setNewGoalTargetAmount,
    selectedGoal, setSelectedGoal,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionAmount, setNewTransactionAmount,
    createGoalDialogIsOpen, setCreateGoalDialogIsOpen,
    allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen,
    spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen,
  };
};

export default useHomeStates;
