import Currency from '@/enums/currency';
import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import { useState } from 'react';

const useWalletsStates = () => {
  const [wallets, setWallets] = useState<WalletListItem[]>([]);

  const [createWalletDialogIsOpen, setCreateWalletDialogIsOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletCurrency, setNewWalletCurrency] = useState(Currency.Euro);

  return {
    wallets, setWallets,
    createWalletDialogIsOpen, setCreateWalletDialogIsOpen,
    newWalletName, setNewWalletName,
    newWalletCurrency, setNewWalletCurrency,
  };
};

export default useWalletsStates;
