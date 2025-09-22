import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import useHomeEvents from '@/features/home/events/home-events';
import { useCallback } from 'react';

type HomeSpendMoneyDialogProps = {
  spendMoneyDialogIsOpen: boolean;
  setSpendMoneyDialogIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  goalName: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  spendMoney: ReturnType<typeof useHomeEvents>['spendMoney'];
};

const HomeSpendMoneyDialog = (props: HomeSpendMoneyDialogProps) => {
  const spendFundsFormOnSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.spendMoney();
  }, [props.spendMoney]);

  const spendFundsButtonOnClick = useCallback(() => {
    props.spendMoney();
  }, [props.spendMoney]);

  return <Dialog open={props.spendMoneyDialogIsOpen} onOpenChange={props.setSpendMoneyDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Spend Money from {props.goalName}</DialogTitle>
        <DialogDescription>
          Enter your transaction details here. Click save when you&apos;re
          done.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={spendFundsFormOnSubmit} className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="description">Description</Label>
          <Input onChange={event => props.setDescription(event.target.value)} id="description" name="description" placeholder="Enter description" autoComplete="off" />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="amount">Amount</Label>
          <Input onChange={event => props.setAmount(event.target.value)} id="amount" name="amount" placeholder="Enter amount" autoComplete="off" />
        </div>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={spendFundsButtonOnClick} type="button">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeSpendMoneyDialog;
