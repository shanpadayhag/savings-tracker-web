import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import { useState } from 'react';
import { toast } from 'sonner';

type HomeResetAccountConfirmationDialogProps = {
  resetDialogIsOpen: ReturnType<typeof useHomeStates>['resetDialogIsOpen'];
  setResetDialogIsOpen: ReturnType<typeof useHomeStates>['setResetDialogIsOpen'];
  handleResetAccount: ReturnType<typeof useHomeEvents>['handleResetAccount'];
};

const HomeResetAccountConfirmationDialog = (
  props: HomeResetAccountConfirmationDialogProps
) => {
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleConfirmResetAccount = () => {
    if (confirmationInput.trim().toLowerCase() === "reset") {
      props.handleResetAccount();
    } else {
      toast.error("Incorrect Confirmation 🤔", { description: "To confirm, you must type RESET in uppercase." });
    }
  };

  const confirmResetAccountFormOnSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleConfirmResetAccount();
  };

  const confirmResetAccountButtonOnClick = () => {
    handleConfirmResetAccount();
  };

  return <Dialog open={props.resetDialogIsOpen} onOpenChange={props.setResetDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Permanent Account Reset</DialogTitle>
        <DialogDescription>
          This action is irreversible and will delete everything. To confirm, please type <b>RESET</b> in the box below.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={confirmResetAccountFormOnSubmit} className="flex items-center gap-2">
        <div className="grid flex-1 gap-2">
          <Label htmlFor="confirmation-input" className="sr-only">Link</Label>
          <Input onChange={event => setConfirmationInput(event.target.value)} placeholder="RESET" id="confirmation-input" />
        </div>

        <button className="hidden">Submit</button>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={confirmResetAccountButtonOnClick} type="button">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeResetAccountConfirmationDialog;
