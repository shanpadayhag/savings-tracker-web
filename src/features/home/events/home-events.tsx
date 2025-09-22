import useHomeStates from '@/features/home/states/home-states';
import getTransactionChunksForExport from '@/features/transactions/api/get-transaction-chunks-for-export';
import storeTransactionsViaImport from '@/features/transactions/api/store-transactions-via-import';
import browserFileUtil from '@/utils/browser-file-util';
import { DateUtil } from '@/utils/date-util';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useHomeEvents = (states: ReturnType<typeof useHomeStates>) => {
  /**
   * Handles the click event for exporting transactions.
   *
   * This function retrieves transactions in chunks, generates a unique, timestamped
   * JSON file for each chunk, and initiates a download for each one.
   * After processing all chunks, it displays a success toast notification to the user.
   *
   * @returns {Promise<void>} A promise that resolves once all file downloads have been
   * initiated and the success notification is displayed.
   */
  const exportTransactionsOnClick = useCallback(async () => {
    const transactionChunks = getTransactionChunksForExport();
    const timestamp = DateUtil.toTimestampString();
    const baseFilename = `savings_tracker_${timestamp}`;
    let chunkIndex = 0;

    for await (const chunk of transactionChunks) {
      const filenameSuffix = chunkIndex > 0 ? `_${chunkIndex}` : '';
      const downloadFilename = `${baseFilename}${filenameSuffix}.json`;
      const content = JSON.stringify(chunk, null, 2);

      browserFileUtil.downloadStringAsFile(downloadFilename, content);
      chunkIndex++;
    }

    const fileCount = chunkIndex;
    const fileWord = fileCount === 1 ? 'file' : 'files';
    const title = "All done! ✨";
    const description = `Your ${fileCount} ${fileWord} are ready for you.`;

    toast.success(title, {
      description: description,
    });
  }, []);

  /**
   * Handles the click event for importing transactions.
   *
   * This function opens a file dialog for the user to select one or more JSON files.
   * It reads, parses, and validates the content, then stores all valid transactions
   * in the database using a bulk operation. It provides feedback to the user
   * via toast notifications upon completion or failure.
   *
   * @returns {Promise<void>} A promise that resolves once the import process is complete.
   */
  const importTransactionsOnClick = useCallback(async () => {
    try {
      const fileContents = await browserFileUtil.openAndReadFiles({
        accept: '.json',
        multiple: true,
      });

      const transactionsToImport = fileContents.flatMap((content) => {
        try {
          const data = JSON.parse(content);
          return Array.isArray(data) ? data : [];
        } catch {
          return [];
        }
      });

      if (transactionsToImport.length === 0) {
        toast.info("Nothing to import!", {
          description: "We couldn't find any valid transactions in the files you selected.",
        });
        return;
      }

      storeTransactionsViaImport({ transactions: transactionsToImport });

      const count = transactionsToImport.length;
      const transactionWord = count === 1 ? 'transaction' : 'transactions';
      toast.success("Import complete! ✨", {
        description: `We've successfully added your ${count} ${transactionWord}.`,
      });
    } catch (error) {
      toast.error("Oops, something went wrong.", {
        description: "The import failed. Please check the files and try again.",
      });
    }
  }, []);

  const allocateFunds = useCallback(async () => {

  }, []);

  const allocateFundsFormOnSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    allocateFunds();
  }, []);

  const allocateFundsButtonOnClick = useCallback(() => {
    allocateFunds();
  }, []);

  return {
    exportTransactionsOnClick,
    importTransactionsOnClick,
    allocateFundsFormOnSubmit,
    allocateFundsButtonOnClick,
  };
};

export default useHomeEvents;
