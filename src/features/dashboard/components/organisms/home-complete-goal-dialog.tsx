import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import { useCallback } from 'react';

type HomeCompleteGoalDialogProps = {
  completeGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['completeGoalDialogIsOpen'];
  setCompleteGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['setCompleteGoalDialogIsOpen'];
  selectedGoal: ReturnType<typeof useDashboardStates>['selectedGoal'];
  handleCompleteGoal: ReturnType<typeof useDashboardEvents>['handleCompleteGoal'];
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
