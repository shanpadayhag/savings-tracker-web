import GoalListItem from '@/features/goals/entities/goal-list-item';
import TransactionListItem from '@/features/transactions/entities/transaction-list-item';
import TransactionType from '@/features/transactions/enums/transaction-type';
import User from '@/features/user/entities/user';
import { db } from '@/lib/utils';
import currencyUtil from '@/utils/currency-util';
import currency from 'currency.js';

type DeallocateFundsFromGoalProps = {
  goalID: GoalListItem['id'];
  goalName: GoalListItem['name'];
  goalCurrentAmount: currency;
  userID: User['id'];
  userTotalAvailableFunds: User['financialSummary']['totalAvailableFunds'];
  userCurrency: User['financialSummary']['currency'];
};

const deallocateFundsFromGoal = async (props: DeallocateFundsFromGoalProps) => {
  const now = new Date();

  const transaction: TransactionListItem = {
    type: TransactionType.GoalDeallocation,
    activity: `Returned ${props.goalCurrentAmount.format()} from ${props.goalName}`,
    description: "The goal was archived, so its remaining balance was returned to your main account.",
    createdAt: now,
    goalActivity: {
      goalID: props.goalID!,
      amount: props.goalCurrentAmount.value,
    },
  };
  const newUserTotalFunds = currencyUtil.parse(props.userTotalAvailableFunds)
    .add(props.goalCurrentAmount)
    .value;

  db.transactionList.add(transaction);
  db.goalList.update(props.goalID!, { currentAmount: 0 });
  db.user.update(props.userID, {
    financialSummary: {
      totalAvailableFunds: newUserTotalFunds,
      currency: props.userCurrency,
      lastUpdated: now,
    }
  });
};

export default deallocateFundsFromGoal;
