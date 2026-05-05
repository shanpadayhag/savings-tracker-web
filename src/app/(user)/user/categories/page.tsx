"use client";

import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import CategoryColorPicker from '@/features/categories/components/category-color-picker';
import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import useCategoriesEvents from '@/features/categories/events/categories-events';
import useCategoriesStates from '@/features/categories/states/categories-states';
import { IconDotsVertical, IconLock, IconPlus, IconSearch, IconTags } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect, useMemo } from 'react';

export default () => {
  const states = useCategoriesStates();
  const events = useCategoriesEvents(states);

  useEffect(() => {
    events.handleFetchCategories();
  }, []);

  const createFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleCreateCategory();
  }, [events.handleCreateCategory]);

  const editFormOnSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    events.handleUpdateCategory();
  }, [events.handleUpdateCategory]);

  const openCreateDialog = useCallback(() => {
    states.setNewCategoryName("");
    states.setNewCategoryColor(categoryColorPalette[0].value);
    states.setCreateDialogIsOpen(true);
  }, []);

  const counts = useMemo(() => {
    const customCount = states.categories.filter(c => !c.isSystem).length;
    const systemCount = states.categories.filter(c => c.isSystem).length;
    return { total: states.categories.length, customCount, systemCount };
  }, [states.categories]);

  const sortedCategories = useMemo(() =>
    [...states.categories].sort((a, b) => {
      if (a.isSystem !== b.isSystem) return a.isSystem ? 1 : -1;
      return a.name.localeCompare(b.name);
    }), [states.categories]);

  return <>
    <div className="flex flex-col overflow-auto h-full pb-8 gap-6">
      <div className="w-full px-4 pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Tagging</p>
            <h1 className="heading-display mt-2 text-3xl font-semibold lg:text-4xl">Categories</h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Group your transactions so spending reads in plain language. Anything left untagged falls back to "Others".
            </p>
          </div>

          {counts.total > 0 && (
            <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
              <p className="eyebrow">Tags in use</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="numeral-hero text-3xl font-semibold tabular-nums">{counts.total}</span>
                <span className="text-xs text-muted-foreground">
                  {counts.customCount} custom &middot; {counts.systemCount} system
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input disabled className="pl-9" placeholder="Search categories (coming soon)" />
        </div>

        <Button onClick={openCreateDialog}>
          <IconPlus className="size-4" /> New Category
        </Button>
      </div>

      <div className="px-4">
        {sortedCategories.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
              <IconTags className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-medium">No categories yet.</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Create a category, then tag transactions with it to see exactly where your money is going.
            </p>
            <Button className="mt-6" onClick={openCreateDialog}>
              <IconPlus className="size-4" /> Create a category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedCategories.map(category => (
              <article key={category.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="h-2 w-full" style={{ backgroundColor: category.color }} aria-hidden="true" />

                <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="size-3.5 shrink-0 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: category.color }}
                        aria-hidden="true" />
                      <h3 className="heading-display truncate text-base font-semibold tracking-tight">
                        {category.name}
                      </h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="-mr-2 -mt-1 size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 data-[state=open]:bg-muted">
                          <IconDotsVertical className="size-4" />
                          <span className="sr-only">Category actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuLabel>Category</DropdownMenuLabel>
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => events.handleStartEdit(category)}>
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => events.handleStartDelete(category)}
                            disabled={category.isSystem}>
                            <span className="text-rose-700 dark:text-rose-400">Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {category.isSystem && (
                    <div className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <IconLock className="size-3" />
                      System
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Create dialog */}
    <Dialog open={states.createDialogIsOpen} onOpenChange={states.setCreateDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
          <DialogDescription>
            Pick a name and a color. You'll be able to tag transactions with this category once it's created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={createFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={states.newCategoryName}
              onChange={event => states.setNewCategoryName(event.target.value)}
              placeholder="e.g. Groceries" />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <CategoryColorPicker
              value={states.newCategoryColor}
              onChange={states.setNewCategoryColor} />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={events.handleCreateCategory} type="button">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit dialog */}
    <Dialog open={states.editDialogIsOpen} onOpenChange={states.setEditDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            {states.editingCategory?.isSystem
              ? "The system 'Others' category's name is locked, but you can pick a new color."
              : "Rename or recolor this category. Transactions already tagged with it will keep using it."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={editFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={states.editCategoryName}
              onChange={event => states.setEditCategoryName(event.target.value)}
              placeholder="Category name"
              disabled={states.editingCategory?.isSystem} />
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <CategoryColorPicker
              value={states.editCategoryColor}
              onChange={states.setEditCategoryColor} />
          </div>

          <button className="hidden" type="submit">Submit</button>
        </form>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={events.handleUpdateCategory} type="button">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete confirmation */}
    <Dialog open={states.deleteDialogIsOpen} onOpenChange={states.setDeleteDialogIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this category?</DialogTitle>
          <DialogDescription>
            "{states.deletingCategory?.name}" will be removed from your pickers. Any transactions tagged with it will fall back to "Others".
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={events.handleConfirmDelete} type="button" variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
};
