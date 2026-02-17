"use client";

import { useEffect, useState } from "react";
import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import { apiClient, type User } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface UserComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserCombobox({
  value,
  onValueChange,
  placeholder = "Select a user...",
  disabled,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    apiClient
      .getUsers()
      .then((all) => setUsers(all.filter((u) => u.role !== "account")))
      .catch(() => {});
  }, []);

  const selected = users.find((u) => String(u.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-auto min-h-9 py-1.5"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{selected.full_name || selected.email}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 shrink-0 ml-2">
            {value && (
              <span
                role="button"
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onValueChange("");
                }}
              >
                <XIcon className="size-3 text-muted-foreground" />
              </span>
            )}
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`${u.full_name || ""} ${u.email}`}
                  onSelect={() => {
                    onValueChange(String(u.id));
                    setOpen(false);
                  }}
                  data-checked={String(u.id) === value}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">
                      {u.full_name || u.email}
                    </span>
                    {u.full_name && (
                      <span className="text-xs text-muted-foreground truncate">
                        {u.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
