import User from '@/features/user/entities/user-old';

type Activity = {
  id: string;
  userID: User['id'];
  // action_type (A short string like 'goal_created', 'transaction_added')
  // target_id (The ID of the item being acted upon, e.g., 'g_abc123')
  // target_type (The table name of the item, e.g., 'goals')
  // created_at (Timestamp of the activity)
};

export default Activity;

