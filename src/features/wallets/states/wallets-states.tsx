import Currency from '@/enums/currency';
import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import { useState } from 'react';

const useWalletsStates = () => {
  const [wallets, setWallets] = useState<WalletListItem[]>([]);

  const [createWalletDialogIsOpen, setCreateWalletDialogIsOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletCurrency, setNewWalletCurrency] = useState<Currency>();

  const [allocateDialogIsOpen, setAllocateDialogIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletListItem>();
  const [allocateAmount, setAllocateAmount] = useState("");

  return {
    wallets, setWallets,
    createWalletDialogIsOpen, setCreateWalletDialogIsOpen,
    newWalletName, setNewWalletName,
    newWalletCurrency, setNewWalletCurrency,
    allocateDialogIsOpen, setAllocateDialogIsOpen,
    selectedWallet, setSelectedWallet,
    allocateAmount, setAllocateAmount,
  };
};

export default useWalletsStates;
