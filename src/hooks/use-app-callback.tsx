import { AppError } from '@/errors/app-error';
import { DependencyList, useCallback } from 'react';
import { toast } from 'sonner';

const useAppCallback = (fn: Function, dependencies: DependencyList) => {
  return useCallback(async () => {
    try {
      await fn();
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't process the request. Please try again in a moment or report it to the developer." });
    }
  }, dependencies);
};

export default useAppCallback;
