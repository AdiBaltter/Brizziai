import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SearchableEntitySelect({ entityType, list, selectedId, onSelect, placeholder }) {
    const [open, setOpen] = useState(false);

    const getDisplayName = (item) => {
        if (!item) return '';
        if (entityType === 'client') {
            return `${item.first_name} ${item.last_name}`;
        }
        return item.full_name;
    };

    const selectedValue = list.find(item => item.id === selectedId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {selectedValue ? getDisplayName(selectedValue) : placeholder}
                    <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={`חיפוש ${entityType === 'client' ? 'לקוח' : 'ליד'}...`} />
                    <CommandList>
                        <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>
                        <CommandGroup>
                            {list.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={`${getDisplayName(item)} ${item.id}`} // Make value unique for search
                                    onSelect={() => {
                                        onSelect(item.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "ml-2 h-4 w-4",
                                            selectedId === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {getDisplayName(item)}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}