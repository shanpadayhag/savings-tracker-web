import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import useHomeEvents from '@/features/home/events/home-events';
import useHomeStates from '@/features/home/states/home-states';
import currencyUtil from '@/utils/currency-util';
import { useCallback } from 'react';

type HomeCompleteGoalDialogProps = {
  completeGoalDialogIsOpen: ReturnType<typeof useHomeStates>['completeGoalDialogIsOpen'];
  setCompleteGoalDialogIsOpen: ReturnType<typeof useHomeStates>['setCompleteGoalDialogIsOpen'];
  selectedGoal: ReturnType<typeof useHomeStates>['selectedGoal'];
  handleCompleteGoal: ReturnType<typeof useHomeEvents>['handleCompleteGoal'];
};

const HomeCompleteGoalDialog = (props: HomeCompleteGoalDialogProps) => {
  const confirmOnClick = useCallback(() => {
    props.handleCompleteGoal();
  }, [props.handleCompleteGoal]);

  return <Dialog open={props.completeGoalDialogIsOpen} onOpenChange={props.setCompleteGoalDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Mark "{props.selectedGoal?.name}" as Complete? 🏆</DialogTitle>
        <DialogDescription>
          You have successfully reached your target for this goal.<br />
          Confirming completion will move this goal from your active list. It will not be deleted and can always be reviewed in your Goal History.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={confirmOnClick} type="button">Confirm</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeCompleteGoalDialog;
