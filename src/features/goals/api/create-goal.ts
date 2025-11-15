import { AppError } from '@/errors/app-error';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus from '@/features/goals/enums/goal-status';
import { db } from '@/lib/utils';

/**
 * Defines the parameters for creating a new goal.
 * It requires a name and target amount, while ID and groupID are optional.
 */
type CreateGoalParameters = Pick<GoalListItem, 'name' | 'targetAmount'> &
  Partial<Pick<GoalListItem, 'id' | 'groupID'>>;

/**
 * Creates a new savings goal and adds it to the database.
 *
 * @param {CreateGoalParameters} params - The details for the new goal.
 * @returns {Promise<Goal>} A promise that resolves with the newly created goal object.
 * @throws {Error} If the name is empty or the target amount is not positive.
 */
const createGoal = async ({
  id = crypto.randomUUID(),
  groupID = crypto.randomUUID(),
  name,
  targetAmount,
}: CreateGoalParameters): Promise<GoalListItem> => {
  if (!name?.trim()) throw new AppError("Name Your Goal 🎯", "Every great goal needs a name. What will you call this one?");
  if (targetAmount <= 0) throw new AppError("Set a Target 📈", "What number are you aiming for? Please enter an amount greater than zero.");

  const newGoal: GoalListItem = {
    id,
    groupID,
    name,
    targetAmount,
    currentAmount: 0,
    status: GoalStatus.Active,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.goalList.add(newGoal);
  return newGoal;
};

export default createGoal;
