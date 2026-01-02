"use client";

import Currency from '@/enums/currency';
import createWallet from '@/features/wallets/api/create-wallet';
import appDBUtil from '@/utils/app-db-util';
import documentDBUtil from '@/utils/document-db-util';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

export default () => {
  const searchParams = useSearchParams();
  const walletName = useMemo(() => (searchParams.get("wallet_name") || "Default"), []);
  const walletCurrency = useMemo(() => ((searchParams.get("wallet_currency") as Currency) || Currency.Euro), []);

  useEffect(() => {
    (async () => {
      const now = new Date();
      await appDBUtil.wallets.clear();
      await documentDBUtil.wallet_list.clear();

      await createWallet({
        name: walletName,
        currency: walletCurrency,
      });
    })();
  }, []);

  return "Transferring"
};
