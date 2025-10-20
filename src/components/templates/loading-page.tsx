import { MaskContainer } from '@/components/organisms/svg-mask-effect';

const LoadingPage = () => {
  return <div className="relative h-screen w-screen">
    <MaskContainer
      className="text-white dark:text-black"
      revealText={<>
        <p className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-800 dark:text-white">
          Loading...
        </p>
      </>}>
      Made by Shan Padayhag.
    </MaskContainer>
  </div>;
};

export default LoadingPage;
