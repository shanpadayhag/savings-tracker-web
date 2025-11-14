import { AppError } from '@/errors/app-error';
import resetAccount from '@/features/accounts/api/reset-account';
import archiveGoal from '@/features/goals/api/archive-goal';
import createGoal from '@/features/goals/api/create-goal';
import fetchGoals from '@/features/goals/api/fetch-goals';
import GoalListItem from '@/features/goals/entities/goal-list-item';
import useHomeStates from '@/features/home/states/home-states';
import allocateFundsToGoal from '@/features/transactions/api/allocate-funds-to-goal';
import getTransactionChunksForExport from '@/features/transactions/api/get-transaction-chunks-for-export';
import getTransactions from '@/features/transactions/api/get-transactions';
import processImportedTransactions from '@/features/transactions/api/process-imported-transactions';
import spendFundsFromGoal from '@/features/transactions/api/spend-funds-from-goal';
import ExportedTransactionListItem from '@/features/transactions/entities/exported-transaction-list-item';
import fetchSingletonUser from '@/features/user/api/fetch-singleton-user';
import { db } from '@/lib/utils';
import browserFileUtil from '@/utils/browser-file-util';
import currencyUtil from '@/utils/currency-util';
import dateUtil from '@/utils/date-util';
import jsonUtil from '@/utils/json-util';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useHomeEvents = (states: ReturnType<typeof useHomeStates>) => {
  /**
   * A memoized callback function to fetch the authenticated user's data.
   * It updates the state with the user details upon success.
   * If the fetch fails, it logs the error and displays a toast notification.
   */
  const handleFetchAuthUser = useCallback(async () => {
    try {
      states.setAuthUser(await fetchSingletonUser());
    } catch (error) {
      console.error("User Fetch Failed:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("", { description: "" });
    }
  }, []);

  /**
   * Fetches the list of active goals and updates the application state accordingly.
   *
   * This memoized callback retrieves goal data from the API. Upon success, it
   * performs two state updates:
   * 1. It populates the main goal list state with the full, raw goal objects.
   * 2. It transforms this data into a { label, value } format, optimized for
   *    UI components like dropdowns or comboboxes, and updates the relevant state.
   */
  const handleFetchGoals = useCallback(async () => {
    const goals = await fetchGoals();

    states.setGoalList(goals);
    states.setComboboxGoalItems(goals.map(goal => ({
      label: goal.name,
      value: goal.id!.toString()
    })));
  }, []);


  /**
   * A memoized callback that fetches the latest transactions and updates the
   * application state.
   *
   * It calls the async `getTransactions` function and passes the result to
   * the `states.setTransactionList` state setter.
   * Wrapped in `useCallback` for performance optimization in React components.
   */
  const handleFetchTransactions = useCallback(async () => {
    states.setTransactionList(await getTransactions());
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
    const timestamp = dateUtil.toTimestampString();
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
      handleFetchAuthUser();
      handleFetchGoals();
      handleFetchTransactions();

      const count = transactionsToImport.length;
      const transactionWord = count === 1 ? 'transaction' : 'transactions';
      toast.success("Import complete! ✨", {
        description: `We've successfully added your ${count} ${transactionWord}.`,
      });
    } catch (error) {
      console.error("Failed to import data:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no! 😥", { description: "The import failed. Please check the files and try again." });
    }
  }, []);

  /**
   * Handles the creation of a new financial goal.
   * It validates the goal's name and target amount before making the API call.
   * Displays success or error notifications to the user based on the outcome.
   */
  const handleCreateGoal = useCallback(async () => {
    const goalName = states.newGoalName.trim();
    const targetAmount = currencyUtil.parse(states.newGoalTargetAmount).value;

    if (!goalName) {
      return toast.error("Hold on! 📝", {
        description: "Please give your goal a name to continue.",
      });
    } else if (targetAmount <= 0) {
      return toast.error("Check the numbers! 💰", {
        description: "The target amount must be greater than zero.",
      });
    }

    try {
      await createGoal({
        name: goalName,
        targetAmount: targetAmount,
      });

      handleFetchGoals();

      states.setCreateGoalDialogIsOpen(false);
      states.setNewGoalName("");
      states.setNewGoalTargetAmount("");

      toast.success("Goal Created! 🎉", {
        description: `Your new goal "${goalName}" has been added.`,
      });
    } catch (error) {
      console.error("Failed to create goal:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no! 😥", { description: "We couldn't save your goal. Please try again." });
    }
  }, [states.newGoalName, states.newGoalTargetAmount]);

  /**
   * Handles allocating funds to a selected goal.
   * It validates that a goal is selected, constructs the transaction payload,
   * calls the API, and displays success or error notifications.
   */
  const handleAllocateFromGoal = useCallback(async () => {
    const { selectedGoal, newTransactionDescription, newTransactionAmount } = states;

    if (!selectedGoal) {
      return toast.error("Just one thing...", {
        description: "Please pick a goal before saving your transaction.",
      });
    }

    try {
      await allocateFundsToGoal({
        goalID: selectedGoal.id,
        description: newTransactionDescription,
        amount: currencyUtil.parse(newTransactionAmount).value,
      });

      handleFetchAuthUser();
      handleFetchGoals();
      handleFetchTransactions();

      states.setAllocateMoneyDialogIsOpen(false);
      states.setNewTransactionDescription("");
      states.setNewTransactionAmount("");

      toast.success("All set!", {
        description: `Your transaction for '${selectedGoal.name}' has been saved.`,
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong.", { description: "We couldn't save your transaction. Please try again in a moment." });
    }
  }, [states.selectedGoal, states.newTransactionDescription, states.newTransactionAmount]);

  /**
   * Handles spending funds from a selected goal.
   * It validates that a goal is selected, constructs the transaction payload,
   * calls the API, and displays success or error notifications.
   */
  const handleSpendFromGoal = useCallback(async () => {
    const { selectedGoal, newTransactionDescription, newTransactionAmount } = states;

    if (!selectedGoal) {
      return toast.error("Just one thing...", {
        description: "Please pick a goal before saving your transaction.",
      });
    }

    try {
      await spendFundsFromGoal({
        goalID: selectedGoal.id,
        description: newTransactionDescription,
        amount: currencyUtil.parse(newTransactionAmount).value,
      });

      handleFetchGoals();
      handleFetchTransactions();

      states.setSpendMoneyDialogIsOpen(false);
      states.setNewTransactionDescription("");
      states.setNewTransactionAmount("");

      toast.success("All set!", {
        description: `Your transaction for '${selectedGoal.name}' has been saved.`,
      });
    } catch (error) {
      console.error("Transaction failed:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong.", { description: "We couldn't save your transaction. Please try again in a moment." });
    }
  }, [states.selectedGoal, states.newTransactionDescription, states.newTransactionAmount]);

  /**
   * Handles the resetting of the user's account.
   * It calls the API to reset the account, re-fetches the latest user and
   * goal data, and displays success or error notifications.
   */
  const handleResetAccount = useCallback(async () => {
    try {
      await resetAccount();

      states.setResetDialogIsOpen(false);
      handleFetchAuthUser();
      handleFetchGoals();
      handleFetchTransactions();

      toast.success("Account Reset! ✨", {
        description: "Your account has been successfully reset.",
      });
    } catch (error) {
      console.error("Reset failed:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't reset your account. Please try again in a moment." });
    }
  }, []);

  const handleArchiveGoal = useCallback(async () => {
    try {
      if (!states.selectedGoal) throw new AppError("Select a Goal 🎯", "Please choose which goal this action applies to before continuing.");

      await db.transaction('rw', db.user, db.transactionList, db.goalList, async () => {
        await archiveGoal({
          goal: states.selectedGoal!,
          user: states.authUser!,
        });
      });

      states.setArchiveGoalDialogIsOpen(false);
      handleFetchAuthUser();
      handleFetchGoals();
      handleFetchTransactions();

      toast.success("Goal Archived! 📦", {
        description: `"${states.selectedGoal.name}" is now archived. The remaining balance has been returned to your account.`,
      });
    } catch (error) {
      console.error("Goal Archive Failed:", error);
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't archive the goal. Please try again in a moment." });
    }
  }, [states.selectedGoal, states.authUser]);

  return {
    handleFetchAuthUser,
    handleFetchGoals,
    handleFetchTransactions,
    exportTransactionsOnClick,
    importTransactionsOnClick,
    handleCreateGoal,
    handleAllocateFromGoal,
    handleSpendFromGoal,
    handleResetAccount,
    handleArchiveGoal,
  };
};

export default useHomeEvents;
