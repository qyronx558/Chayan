"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface SearchableFilterOption {
 id: string
 name: string
}

interface SearchableFilterProps {
 value: string
 options: SearchableFilterOption[]
 allLabel: string
 searchPlaceholder?: string
 onChange: (id: string) => void
 /** Extra classes for the popover content (e.g. raise z-index inside a Sheet). */
 popoverClassName?: string
}

/**
 * Searchable dropdown for the gov-jobs filter bar.
 * Button trigger + popover with an inbuilt search input (cmdk).
 */
export function SearchableFilter({
 value,
 options,
 allLabel,
 searchPlaceholder = "Search...",
 onChange,
 popoverClassName,
}: SearchableFilterProps) {
 const [open, setOpen] = useState(false)
 const selected = options.find((o) => o.id === value)

 return (
  <Popover open={open} onOpenChange={setOpen}>
   <PopoverTrigger asChild>
    <Button
     variant="outline"
     role="combobox"
     aria-expanded={open}
     className="h-10 w-full min-w-0 justify-between truncate bg-background px-3 py-2 text-sm font-normal"
    >
     <span className="min-w-0 flex-1 truncate text-left">
      {selected ? selected.name : allLabel}
     </span>
     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
   </PopoverTrigger>
   <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0", popoverClassName)} align="start">
    <Command>
     <CommandInput placeholder={searchPlaceholder} />
     <CommandList>
      <CommandEmpty>No match found.</CommandEmpty>
      <CommandGroup>
       <CommandItem
        value={`all ${allLabel}`}
        onSelect={() => {
         onChange("")
         setOpen(false)
        }}
       >
        <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
        {allLabel}
       </CommandItem>
       {options.map((o) => (
        <CommandItem
         key={o.id}
         value={o.name}
         onSelect={() => {
          onChange(o.id)
          setOpen(false)
         }}
        >
         <Check className={cn("mr-2 h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
         <span className="truncate">{o.name}</span>
        </CommandItem>
       ))}
      </CommandGroup>
     </CommandList>
    </Command>
   </PopoverContent>
  </Popover>
 )
}
