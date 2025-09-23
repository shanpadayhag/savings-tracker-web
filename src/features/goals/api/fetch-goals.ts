import GoalListItem from '@/features/goals/entities/goal-list-item';
import { db } from '@/lib/utils';

/**
 * Fetches all goals with an 'active' status from the database.
 * @returns {Promise<GoalListItem[]>} A promise that resolves to an array of active goals.
 */
const fetchGoals = async (): Promise<GoalListItem[]> => {
  return db.goalList
    .orderBy('updatedAt').reverse()
    .filter(goal => goal.status === 'active')
    .toArray();
};

export default fetchGoals;
