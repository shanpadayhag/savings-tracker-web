import { ComboboxOption } from '@/components/molecules/combobox';
import currency from 'currency.js';

type WalletOption = ComboboxOption<{ currentAmount: currency; }>;

export default WalletOption;
