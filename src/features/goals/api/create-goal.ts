import GoalListItem from '@/features/goals/entities/goal-list-item';
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
  if (!name?.trim()) throw new Error('Goal name cannot be empty.');
  if (targetAmount <= 0) throw new Error('Target amount must be a positive number.');

  const newGoal: GoalListItem = {
    id,
    groupID,
    name,
    targetAmount,
    currentAmount: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.goalList.add(newGoal);
  return newGoal;
};

export default createGoal;
