"use client";

import * as React from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/atoms/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/atoms/popover";

export type ComboboxItem = {
  value: string; label: string;
};

export type ComboboxItems = ComboboxItem[];

type ComboboxProps = {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyItemsPlaceholder?: string;
  value?: ComboboxItem;
  onChangeValue?: (item: ComboboxItem) => void;
  items?: ComboboxItems;
};

export function Combobox(props: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between">
          {props.value
            ? props.value?.label
            : (props.placeholder || "Select...")}
          <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={props.searchPlaceholder || "Search..."} />
          <CommandList>
            <CommandEmpty>{props.emptyItemsPlaceholder || "No items found."}</CommandEmpty>
            <CommandGroup>
              {props.items?.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => {
                    props.onChangeValue?.(item);
                    setOpen(false);
                  }}
                >
                  <IconCheck
                    className={cn(
                      "mr-2 h-4 w-4",
                      item.value === props.value?.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
