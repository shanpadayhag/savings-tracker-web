"use client";

import WIPPlaceholder from '@/components/molecules/wip-placeholder';

export default () => {
  return <div className="w-full h-full flex items-center justify-center">
    <div className="w-120 h-150 pt-30">
      <WIPPlaceholder
        title="Reports"
        content="Visualize your savings with graphs and detailed lists." />
    </div>
  </div>;
};
