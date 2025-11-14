import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import currencyUtil from '@/utils/currency-util';
import { useCallback } from 'react';

type HomeArchiveGoalDialogProps = {
  archiveGoalDialogIsOpen: ReturnType<typeof useHomeStates>['archiveGoalDialogIsOpen'];
  setArchiveGoalDialogIsOpen: ReturnType<typeof useHomeStates>['setArchiveGoalDialogIsOpen'];
  selectedGoal: ReturnType<typeof useHomeStates>['selectedGoal'];
  handleArchiveGoal: ReturnType<typeof useHomeEvents>['handleArchiveGoal'];
};

const HomeArchiveGoalDialog = (props: HomeArchiveGoalDialogProps) => {
  const confirmArchiveGoalOnClick = useCallback(() => {
    props.handleArchiveGoal();
  }, [props.handleArchiveGoal]);

  return <Dialog open={props.archiveGoalDialogIsOpen} onOpenChange={props.setArchiveGoalDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Archive Goal "{props.selectedGoal?.name}"?</DialogTitle>
        <DialogDescription>
          {props.selectedGoal?.currentAmount || 0 > 0
          ? `This will archive the goal. The remaining balance of ${currencyUtil.parse(props.selectedGoal?.currentAmount || 0).format()} will be returned to your main account.`
          : `This will archive the goal. This goal has no remaining balance`}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={confirmArchiveGoalOnClick} type="button">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeArchiveGoalDialog;
