import Category from '@/features/categories/entities/category';
import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import { useState } from 'react';

const useCategoriesStates = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  // Create dialog
  const [createDialogIsOpen, setCreateDialogIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState<string>(categoryColorPalette[0].value);

  // Edit dialog (reuses the same form fields, hydrated from `editingCategory`)
  const [editDialogIsOpen, setEditDialogIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState<string>(categoryColorPalette[0].value);

  // Delete confirmation
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category>();

  return {
    categories, setCategories,
    createDialogIsOpen, setCreateDialogIsOpen,
    newCategoryName, setNewCategoryName,
    newCategoryColor, setNewCategoryColor,
    editDialogIsOpen, setEditDialogIsOpen,
    editingCategory, setEditingCategory,
    editCategoryName, setEditCategoryName,
    editCategoryColor, setEditCategoryColor,
    deleteDialogIsOpen, setDeleteDialogIsOpen,
    deletingCategory, setDeletingCategory,
  };
};

export default useCategoriesStates;
