import { AppError } from '@/errors/app-error';
import createCategory from '@/features/categories/api/create-category';
import deleteCategory from '@/features/categories/api/delete-category';
import ensureDefaultCategory from '@/features/categories/api/ensure-default-category';
import getCategories from '@/features/categories/api/get-categories';
import updateCategory from '@/features/categories/api/update-category';
import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import Category from '@/features/categories/entities/category';
import useCategoriesStates from '@/features/categories/states/categories-states';
import { useCallback } from 'react';
import { toast } from 'sonner';

const useCategoriesEvents = (states: ReturnType<typeof useCategoriesStates>) => {
  const handleFetchCategories = useCallback(async () => {
    try {
      // Seed before reading so the user always sees "Others" on first visit.
      await ensureDefaultCategory();
      states.setCategories(await getCategories());
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't load your categories. Please try again in a moment." });
    }
  }, []);

  const handleCreateCategory = useCallback(async () => {
    try {
      await createCategory({
        name: states.newCategoryName,
        color: states.newCategoryColor,
      });

      handleFetchCategories();
      states.setCreateDialogIsOpen(false);
      states.setNewCategoryName("");
      states.setNewCategoryColor(categoryColorPalette[0].value);

      toast.success("Category Created 🏷️", {
        description: "You can now tag transactions with this category."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't create the category. Please try again in a moment." });
    }
  }, [states.newCategoryName, states.newCategoryColor]);

  const handleStartEdit = useCallback((category: Category) => {
    states.setEditingCategory(category);
    states.setEditCategoryName(category.name);
    states.setEditCategoryColor(category.color);
    states.setEditDialogIsOpen(true);
  }, []);

  const handleUpdateCategory = useCallback(async () => {
    if (!states.editingCategory) return;
    try {
      await updateCategory({
        id: states.editingCategory.id,
        name: states.editCategoryName,
        color: states.editCategoryColor,
      });

      handleFetchCategories();
      states.setEditDialogIsOpen(false);
      states.setEditingCategory(undefined);

      toast.success("Category Updated ✏️", {
        description: "Your changes are saved."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't update the category. Please try again in a moment." });
    }
  }, [states.editingCategory, states.editCategoryName, states.editCategoryColor]);

  const handleStartDelete = useCallback((category: Category) => {
    states.setDeletingCategory(category);
    states.setDeleteDialogIsOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!states.deletingCategory) return;
    try {
      await deleteCategory(states.deletingCategory.id);

      handleFetchCategories();
      states.setDeleteDialogIsOpen(false);
      states.setDeletingCategory(undefined);

      toast.success("Category Deleted 🗑️", {
        description: "Transactions tagged with this category will fall back to 'Others'."
      });
    } catch (error) {
      if (error instanceof AppError) toast.error(error.title, { description: error.description });
      else toast.error("Oh no, something went wrong 🤔", { description: "We couldn't delete the category. Please try again in a moment." });
    }
  }, [states.deletingCategory]);

  return {
    handleFetchCategories,
    handleCreateCategory,
    handleStartEdit,
    handleUpdateCategory,
    handleStartDelete,
    handleConfirmDelete,
  };
};

export default useCategoriesEvents;
