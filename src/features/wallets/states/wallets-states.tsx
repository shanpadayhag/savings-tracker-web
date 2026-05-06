import Currency from '@/enums/currency';
import { CategoryOption } from '@/features/categories/components/category-combobox';
import WalletListItem from '@/features/wallets/entities/wallet-list-item';
import { useState } from 'react';

export type WalletCurrencyFilter = 'all' | Currency;

const useWalletsStates = () => {
  const [wallets, setWallets] = useState<WalletListItem[]>([]);
  const [currencyFilter, setCurrencyFilter] = useState<WalletCurrencyFilter>('all');

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

  const [transferDialogIsOpen, setTransferDialogIsOpen] = useState(false);
  const [transferDestinationWallet, setTransferDestinationWallet] = useState<WalletListItem>();
  const [transferAmount, setTransferAmount] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const [spendDialogIsOpen, setSpendDialogIsOpen] = useState(false);
  const [spendAmount, setSpendAmount] = useState("");
  const [spendCategory, setSpendCategory] = useState<CategoryOption>();
  const [spendNotes, setSpendNotes] = useState("");

  const [defundDialogIsOpen, setDefundDialogIsOpen] = useState(false);
  const [defundAmount, setDefundAmount] = useState("");
  const [defundNotes, setDefundNotes] = useState("");

  return {
    wallets, setWallets,
    currencyFilter, setCurrencyFilter,
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
    transferDialogIsOpen, setTransferDialogIsOpen,
    transferDestinationWallet, setTransferDestinationWallet,
    transferAmount, setTransferAmount,
    transferFee, setTransferFee,
    transferNotes, setTransferNotes,
    spendDialogIsOpen, setSpendDialogIsOpen,
    spendAmount, setSpendAmount,
    spendCategory, setSpendCategory,
    spendNotes, setSpendNotes,
    defundDialogIsOpen, setDefundDialogIsOpen,
    defundAmount, setDefundAmount,
    defundNotes, setDefundNotes,
  };
};

export default useWalletsStates;
