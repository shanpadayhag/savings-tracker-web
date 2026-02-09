import { useRef } from 'react';

const useAccountSettingsStates = () => {
  const importFileInputRef = useRef<HTMLInputElement | null>(null);

  return {
    importFileInputRef,
  };
};

export default useAccountSettingsStates;
