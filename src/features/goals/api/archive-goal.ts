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
  const userID = params.user.id;
  const userCurrency = params.user.financialSummary.currency;
  const userTotalAvailableFunds = params.user.financialSummary.totalAvailableFunds;
  const goalName = params.goal.name;
  const goalID = params.goal.id!;
  const goalCurrentAmount = currencyUtil.parse(params.goal.currentAmount, userCurrency);

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
