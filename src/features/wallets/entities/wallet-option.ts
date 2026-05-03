import { ComboboxOption } from '@/components/molecules/combobox';
import Currency from '@/enums/currency';
import currency from 'currency.js';

type WalletOption = ComboboxOption<{ currentAmount: currency; currency: Currency; }>;

export default WalletOption;
