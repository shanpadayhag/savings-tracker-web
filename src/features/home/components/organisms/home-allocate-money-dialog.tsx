import { Button } from '@/components/atoms/button';
import { DialogHeader, DialogFooter, Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import useHomeEvents from '@/features/home/events/home-events';
import { useCallback } from 'react';

type HomeAllocateMoneyDialogProps = {
  allocateMoneyDialogIsOpen: boolean;
  setAllocateMoneyDialogIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  goalName: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  handleAllocateFromGoal: ReturnType<typeof useHomeEvents>['handleAllocateFromGoal'];
};

const HomeAllocateMoneyDialog = (props: HomeAllocateMoneyDialogProps) => {
  const allocateFundsFormOnSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.handleAllocateFromGoal();
  }, [props.handleAllocateFromGoal]);

  const allocateFundsButtonOnClick = useCallback(() => {
    props.handleAllocateFromGoal();
  }, [props.handleAllocateFromGoal]);

  return <Dialog open={props.allocateMoneyDialogIsOpen} onOpenChange={props.setAllocateMoneyDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Allocate Money to {props.goalName}</DialogTitle>
        <DialogDescription>
          Enter your transaction details here. Click save when you&apos;re
          done.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={allocateFundsFormOnSubmit} className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="description">Description</Label>
          <Input onChange={event => props.setDescription(event.target.value)} id="description" name="description" placeholder="Enter description" autoComplete="off" />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="amount">Amount</Label>
          <Input onChange={event => props.setAmount(event.target.value)} id="amount" name="amount" placeholder="Enter amount" autoComplete="off" />
        </div>

        <button type="submit" className="sr-only">Submit</button>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={allocateFundsButtonOnClick} type="button">Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeAllocateMoneyDialog;
