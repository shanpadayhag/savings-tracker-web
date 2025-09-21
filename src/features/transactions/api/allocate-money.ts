import GoalListItem from '@/features/goals/entities/goal-list-item';

type AllocateMoneyProps = {
  goal: GoalListItem;
  description: string;
  amount: number;
};

const allocateMoney = async (props: AllocateMoneyProps) => { };

export default allocateMoney;
