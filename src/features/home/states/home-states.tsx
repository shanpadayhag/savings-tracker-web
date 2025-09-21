import { useState } from 'react';

const useHomeStates = () => {
  const [allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen] = useState(false);
  const [spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen] = useState(false);

  return {
    allocateMoneyDialogIsOpen, setAllocateMoneyDialogIsOpen,
    spendMoneyDialogIsOpen, setSpendMoneyDialogIsOpen,
  };
};

export default useHomeStates;
