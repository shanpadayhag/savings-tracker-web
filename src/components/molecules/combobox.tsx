"use client";

import * as React from "react";
import { IconCheck, IconSelector } from "@tabler/icons-react";

import { cn } from "@/utils/cn";
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

export type ComboboxOption<T> = {
  value: string;
  label: string;
  data?: T;
};

export type ComboboxOptions<T> = ComboboxOption<T>[];

type ComboboxProps<T> = {
  placeholder?: string;
  searchPlaceholder?: string;
  emptyItemsPlaceholder?: string;
  value?: ComboboxOption<T>;
  onChangeValue?: (item: ComboboxOption<T>) => void;
  options?: ComboboxOptions<T>;
  disabled?: boolean;
};

const Combobox = <T extends unknown>(props: ComboboxProps<T>) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={props.disabled}
          className="w-full justify-between">
          {props.value
            ? props.value?.label
            : (props.placeholder || "Select...")}
          <IconSelector className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={props.searchPlaceholder || "Search..."} />
          <CommandList>
            <CommandEmpty>{props.emptyItemsPlaceholder || "No items found."}</CommandEmpty>
            <CommandGroup>
              {props.options?.map((option) => (
                <CommandItem key={option.value}
                  value={option.value}
                  onSelect={() => { props.onChangeValue?.(option); setOpen(false); }}>
                  <IconCheck className={cn("mr-2 h-4 w-4", option.value === props.value?.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Combobox;
