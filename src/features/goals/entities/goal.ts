import GoalStatus from '@/features/goals/enums/goal-status';

type Goal = {
  id: string;
  status: GoalStatus;
  /** Timestamp of the most recent status transition (Active → Completed,
   * Completed → Archived, etc.). Set to createdAt on initial creation.
   * Pre-migration rows may be undefined. */
  statusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | "null";
};

export default Goal;
