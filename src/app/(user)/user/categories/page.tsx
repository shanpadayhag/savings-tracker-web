"use client";

import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/atoms/table';
import CategoryColorPicker from '@/features/categories/components/category-color-picker';
import { categoryColorPalette } from '@/features/categories/data/category-color-palette';
import useCategoriesEvents from '@/features/categories/events/categories-events';
import useCategoriesStates from '@/features/categories/states/categories-states';
import { IconDotsVertical } from '@tabler/icons-react';
import { FormEvent, useCallback, useEffect } from 'react';

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

  return <>
    <div className="flex flex-col overflow-auto h-full pb-2 gap-6">
      <div className="w-full px-4 pt-4">
        <h1 className="text-xl font-semi font-serif lg:text-2xl">Categories</h1>
        <p className="text-sm text-muted-foreground font-light">
          Group your transactions to see where your money goes. Anything left untagged falls under "Others".
        </p>
      </div>

      <div className="flex justify-between items-center px-4">
        <div><Input disabled className="w-70" placeholder="Search for category" /></div>
        <div><Button onClick={openCreateDialog}>New Category</Button></div>
      </div>

      <div className="border-y">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-0">
            <TableRow>
              <TableHead className="w-12"><span className="sr-only">Color</span></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {states.categories.length > 0
              ? <>{states.categories.map(category => <TableRow key={category.id}>
                <TableCell>
                  <span className="size-4 rounded-full inline-block align-middle ml-4"
                    style={{ backgroundColor: category.color }}
                    aria-hidden="true" />
                </TableCell>
                <TableCell className="py-4 font-medium">{category.name}</TableCell>
                <TableCell>
                  {category.isSystem
                    ? <Badge variant="secondary">System</Badge>
                    : <Badge variant="outline">Custom</Badge>}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="data-[state=open]:bg-muted text-muted-foreground flex"
                        variant="ghost" size="icon"
                        disabled={category.isSystem}>
                        <IconDotsVertical /> <span className="sr-only">Category Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-38">
                      <DropdownMenuLabel>Category</DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => events.handleStartEdit(category)}>Edit</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => events.handleStartDelete(category)}>
                          <span className="text-red-700">Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>)}</>
              : <TableRow>
                <TableCell className="h-24 text-center" colSpan={4}>
                  No categories.
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
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
            Rename or recolor this category. Transactions already tagged with it will keep using it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={editFormOnSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={states.editCategoryName}
              onChange={event => states.setEditCategoryName(event.target.value)}
              placeholder="Category name" />
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
