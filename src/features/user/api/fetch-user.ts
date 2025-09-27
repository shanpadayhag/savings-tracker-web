import { db } from '@/lib/utils';

const fetchUser = async () => {
    return db.user.get('singleton');
};

export default fetchUser;
