import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onValueChange: (val: string) => void;
    placeholder: string;
    emptyText: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onValueChange,
    placeholder,
    emptyText,
    className
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-secondary/30 border-white/5 h-10 px-3 font-normal", className)}
                >
                    <span className="truncate">
                        {value === "all" ? placeholder : value}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-slate-900 border-white/10 z-50">
                <Command className="bg-transparent">
                    <CommandInput placeholder={`Buscar ${placeholder.toLowerCase()}...`} />
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                        <CommandItem
                            value="all"
                            onSelect={() => {
                                onValueChange("all");
                                setOpen(false);
                            }}
                            className="cursor-pointer"
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === "all" ? "opacity-100" : "opacity-0"
                                )}
                            />
                            Todos
                        </CommandItem>
                        {options.map((option) => (
                            <CommandItem
                                key={option}
                                value={option}
                                onSelect={(currentValue) => {
                                    // CommandItem value is lowercased by default, 
                                    // but we want the original option string
                                    onValueChange(option === value ? "all" : option);
                                    setOpen(false);
                                }}
                                className="cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
