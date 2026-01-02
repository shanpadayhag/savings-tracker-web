enum GoalStatus {
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

export const goalStatusLabel = {
  [GoalStatus.Active]: "Active",
  [GoalStatus.Completed]: "Completed",
  [GoalStatus.Archived]: "Archived",
};

export default GoalStatus;
