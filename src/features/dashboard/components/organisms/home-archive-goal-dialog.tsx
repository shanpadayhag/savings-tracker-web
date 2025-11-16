import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import Currency from '@/enums/currency';
import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import currencyUtil from '@/utils/currency-util';
import { useCallback } from 'react';

type HomeArchiveGoalDialogProps = {
  authUser: ReturnType<typeof useDashboardStates>['authUser'];
  archiveGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['archiveGoalDialogIsOpen'];
  setArchiveGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['setArchiveGoalDialogIsOpen'];
  selectedGoal: ReturnType<typeof useDashboardStates>['selectedGoal'];
  handleArchiveGoal: ReturnType<typeof useDashboardEvents>['handleArchiveGoal'];
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
          ? `This will archive the goal. The remaining balance of ${currencyUtil.parse(props.selectedGoal?.currentAmount || 0, props.authUser?.financialSummary.currency || Currency.Euro).format()} will be returned to your main account.`
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
