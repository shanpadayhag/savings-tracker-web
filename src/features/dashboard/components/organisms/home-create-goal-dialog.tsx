import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import useDashboardEvents from '@/features/dashboard/events/dashboard-events';
import useDashboardStates from '@/features/dashboard/states/dashboard-states';
import { useCallback } from 'react';

type HomeCreateGoalDialogProps = {
  createGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['createGoalDialogIsOpen'];
  setCreateGoalDialogIsOpen: ReturnType<typeof useDashboardStates>['setCreateGoalDialogIsOpen'];
  handleCreateGoal: ReturnType<typeof useDashboardEvents>['handleCreateGoal'];
  setNewGoalName: ReturnType<typeof useDashboardStates>['setNewGoalName'];
  setNewGoalTargetAmount: ReturnType<typeof useDashboardStates>['setNewGoalTargetAmount'];
};

const HomeCreateGoalDialog = (props: HomeCreateGoalDialogProps) => {
  const createGoalFormOnSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    props.handleCreateGoal();
  }, [props.handleCreateGoal]);

  const createGoalButtonOnClick = useCallback(() => {
    props.handleCreateGoal();
  }, [props.handleCreateGoal]);

  return <Dialog open={props.createGoalDialogIsOpen} onOpenChange={props.setCreateGoalDialogIsOpen}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create goal</DialogTitle>
        <DialogDescription>
          Enter your goal details here. Click save when you&apos;re
          done.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={createGoalFormOnSubmit} className="grid gap-4">
        <div className="grid gap-3">
          <Label htmlFor="name-1">Name</Label>
          <Input onChange={event => props.setNewGoalName(event.target.value)} id="name-1" name="name" placeholder="Enter goal's name" autoComplete="off" />
        </div>

        <div className="flex gap-3">
          <div className="grid gap-3 flex-1">
            <Label htmlFor="target-amount">Target Amount</Label>
            <Input onChange={event => props.setNewGoalTargetAmount(event.target.value)} id="target-amount" name="target-amount" placeholder="Enter goal's target amount" autoComplete="off" />
          </div>

          <button className="hidden" type="submit"></button>
        </div>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={createGoalButtonOnClick}>Save</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
};

export default HomeCreateGoalDialog;
