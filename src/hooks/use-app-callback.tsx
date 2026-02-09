import { AppError } from '@/errors/app-error';
import { DependencyList, useCallback } from 'react';
import { toast } from 'sonner';

const useAppCallback = <T extends (...args: any[]) => any>(
  fn: T, dependencies: DependencyList,
) => {
  return useCallback(async (...args: Parameters<T>) => {
    try {
      await fn(...args);
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't process the request. Please try again in a moment or report it to the developer." });
    }
  }, dependencies);
};

export default useAppCallback;
