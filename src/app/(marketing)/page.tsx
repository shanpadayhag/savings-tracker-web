import { Button, buttonVariants } from '@/components/atoms/button';
import Logo from '@/components/atoms/logo';
import Routes from '@/enums/routes';
import Link from 'next/link';

export default () => {
  return <div className="w-full h-full flex justify-center">
    <div className="w-full lg:w-[1000px]">
      {/* HEADER */}
      <div className="w-full flex justify-between px-4 py-6">
        <div className="flex gap-2 items-center">
          <Logo size={35} />
          Savings Tracker
        </div>
        <div>
          <Button disabled>Login</Button>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="px-4 py-6">
        <div className="lg:w-[50%] w-[70%] flex flex-col gap-8">
          <h1 className="text-4xl font-bold">Finally. A Savings Tracker That's Just for Savings.</h1>
          <p className="text-lg">No complicated budgets. No endless categories. Just a clear, simple view of your progress towards your goals.</p>
          <div>
            <Link href={Routes.UserHome} className={buttonVariants()}>Get Your Simple Tracker</Link>
          </div>
        </div>
      </div>
    </div>
  </div>;
};
