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

  const [convertDialogIsOpen, setConvertDialogIsOpen] = useState(false);
  const [convertDestinationWallet, setConvertDestinationWallet] = useState<WalletListItem>();
  const [convertAmountSent, setConvertAmountSent] = useState("");
  const [convertFee, setConvertFee] = useState("");
  const [convertAmountReceived, setConvertAmountReceived] = useState("");
  const [convertNotes, setConvertNotes] = useState("");

  return {
    wallets, setWallets,
    createWalletDialogIsOpen, setCreateWalletDialogIsOpen,
    newWalletName, setNewWalletName,
    newWalletCurrency, setNewWalletCurrency,
    allocateDialogIsOpen, setAllocateDialogIsOpen,
    selectedWallet, setSelectedWallet,
    allocateAmount, setAllocateAmount,
    convertDialogIsOpen, setConvertDialogIsOpen,
    convertDestinationWallet, setConvertDestinationWallet,
    convertAmountSent, setConvertAmountSent,
    convertFee, setConvertFee,
    convertAmountReceived, setConvertAmountReceived,
    convertNotes, setConvertNotes,
  };
};

export default useWalletsStates;
