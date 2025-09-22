import fetchGoalsApi from '@/features/goals/api/fetch-goals';
import useHomeStates from '@/features/home/states/home-states';
import getTransactionChunksForExport from '@/features/transactions/api/get-transaction-chunks-for-export';
import processImportedTransactions from '@/features/transactions/api/process-imported-transactions';
import spendFundsFromGoal from '@/features/transactions/api/spend-funds-from-goal';
import ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import browserFileUtil from '@/utils/browser-file-util';
import { DateUtil } from '@/utils/date-util';
import jsonUtil from '@/utils/json-util';
import currency from 'currency.js';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useHomeEvents = (states: ReturnType<typeof useHomeStates>) => {
  /**
   * Fetches the list of active goals and updates the application state accordingly.
   *
   * This memoized callback retrieves goal data from the API. Upon success, it
   * performs two state updates:
   * 1. It populates the main goal list state with the full, raw goal objects.
   * 2. It transforms this data into a { label, value } format, optimized for
   *    UI components like dropdowns or comboboxes, and updates the relevant state.
   */
  const fetchGoals = useCallback(async () => {
    const goals = await fetchGoalsApi();

    states.setGoalList(goals);
    states.setComboboxGoalItems(goals.map(goal => ({
      label: goal.name,
      value: goal.id!.toString()
    })));
  }, []);

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
        accept: '.json', multiple: true
      });

      const transactionsToImport = fileContents.flatMap(jsonUtil.parseJsonArray<ExportedTransactionListItem>);

      if (transactionsToImport.length === 0) {
        return toast.info("Nothing to import!", {
          description: "We couldn't find any valid transactions in the files you selected.",
        });
      }

      await processImportedTransactions({ transactions: transactionsToImport });
      fetchGoals();

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

  const allocateMoney = useCallback(async () => {

  }, []);

  /**
   * Handles spending funds from a selected goal.
   * It validates that a goal is selected, constructs the transaction payload,
   * calls the API, and displays success or error notifications.
   */
  const handleSpendFromGoal = async () => {
    const { selectedGoal, newTransactionDescription, newTransactionAmount } = states;

    if (!selectedGoal) {
      return toast.error("Just one thing...", {
        description: "Please pick a goal before saving your transaction.",
      });
    }

    try {
      await spendFundsFromGoal({
        goalID: selectedGoal.id,
        goalName: selectedGoal.name,
        description: newTransactionDescription,
        amount: currency(newTransactionAmount).value,
      });

      fetchGoals();

      states.setSpendMoneyDialogIsOpen(false);
      states.setNewTransactionDescription("");
      states.setNewTransactionAmount("");

      toast.success("All set!", {
        description: `Your transaction for '${selectedGoal.name}' has been saved.`,
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error("Oh no, something went wrong.", {
        description: "We couldn't save your transaction. Please try again in a moment.",
      });
    }
  };

  return {
    fetchGoals,
    exportTransactionsOnClick,
    importTransactionsOnClick,
    allocateMoney,
    handleSpendFromGoal,
  };
};

export default useHomeEvents;
