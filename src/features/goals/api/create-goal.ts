import { db } from '@/lib/utils';

interface CreateGoalParams {
  id?: string;
  groupID?: string;
  name: string;
  targetAmount: number;
}

/**
 * Creates a new savings goal and adds it to the database.
 *
 * @param {CreateGoalParams} params - The details for the new goal.
 * @param {string} params.name - The name of the goal. Must not be empty.
 * @param {number} params.targetAmount - The financial target. Must be a positive number.
 * @param {string} params.currency - The currency code (e.g., 'EUR').
 * @returns {Promise<number>} A promise that resolves with the unique ID of the newly created goal.
 * @throws {Error} If the name is empty or the target amount is not positive.
 */
const createGoal = async ({ id = crypto.randomUUID(), groupID = crypto.randomUUID(), name, targetAmount }: CreateGoalParams) => {
  if (!name?.trim()) throw new Error('Goal name cannot be empty.');
  if (targetAmount <= 0) throw new Error('Target amount must be a positive number.');

  const now = new Date();

  const newGoalObj = {
    id,
    groupID,
    name,
    targetAmount,
    currentAmount: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await db.goalList.add(newGoalObj);
  return newGoalObj;
};

export default createGoal;
