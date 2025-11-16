"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/atoms/select';
import Currency, { currencyLabel } from '@/enums/currency';
import { AppError } from '@/errors/app-error';
import updateCurrency from '@/features/settings/api/update-currency';
import { toast } from 'sonner';

export default () => {
  const handleCurrencyUpdate = async (currency: Currency) => {
    try {
      await updateCurrency(currency);

      toast.success("Currency Changed! 🌐", {
        description: `Success! All amounts will now be displayed in ${currencyLabel[currency]}.`
      });
    } catch (error) {
      console.error("Update Currency Failed: ", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't update the currency. Please try again in a moment." });
    }
  };

  return <Card>
    <CardHeader>
      <CardTitle>Currency</CardTitle>
      <CardDescription>Select the currency used to display all prices and financial data across the application.</CardDescription>
    </CardHeader>

    <CardContent>
      <Select onValueChange={handleCurrencyUpdate}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Currency</SelectLabel>
            {(Object.keys(Currency) as Array<keyof typeof Currency>).map(key => (
              <SelectItem key={key} value={Currency[key]}>
                {currencyLabel[Currency[key]]}
              </SelectItem>))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </CardContent>
  </Card>;
};
