import GoalListItem from '@/features/goals/entities/goal-list-item';
import GoalStatus from '@/features/goals/enums/goal-status';
import deallocateFundsFromGoal from '@/features/transactions/api/deallocate-funds-from-goal';
import User from '@/features/user/entities/user';
import { db } from '@/lib/utils';
import currencyUtil from '@/utils/currency-util';

type ArchiveGoalParams = {
  goal: GoalListItem;
  user: User;
};

const archiveGoal = async (params: ArchiveGoalParams) => {
  const goalID = params.goal.id!;
  const goalName = params.goal.name;
  const goalCurrentAmount = currencyUtil.parse(params.goal.currentAmount);
  const userID = params.user.id;
  const userTotalAvailableFunds = params.user.financialSummary.totalAvailableFunds;
  const userCurrency = params.user.financialSummary.currency;

  if (goalCurrentAmount.value > 0) {
    await deallocateFundsFromGoal({
      goalID, goalName, goalCurrentAmount,
      userID, userTotalAvailableFunds, userCurrency,
    });
  }

  db.goalList.update(goalID, {
    status: GoalStatus.Archived,
  });
};

export default archiveGoal;
