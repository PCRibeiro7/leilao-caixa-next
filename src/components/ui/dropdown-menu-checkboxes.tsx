"use client";

import { CSSProperties, useCallback, useRef, useState } from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "./input";

export type Checked = DropdownMenuCheckboxItemProps["checked"];

type DropdownMenuCheckboxesProps = {
    title: string;
    availableOptions: {
        label: string;
        display?: string;
        checked: Checked;
        icon?: {
            style?: CSSProperties;
            className?: string;
        };
    }[];
    onCheckedChange: (label: string, checked: Checked) => void;
    toggleAll?: () => void;
};

export function DropdownMenuCheckboxes(props: DropdownMenuCheckboxesProps) {
    const { title, availableOptions, onCheckedChange, toggleAll } = props;
    const [visibleOptionsCount, setVisibleOptionsCount] = useState(20);

    const inputRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredAvailableOptions = availableOptions.filter((option) =>
        search ? option.label.toLowerCase().includes(search.toLowerCase()) : true,
    );

    const visibleOptions = filteredAvailableOptions.slice(0, visibleOptionsCount);

    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

            const hiddenOptions = filteredAvailableOptions.length - visibleOptionsCount;

            if (distanceFromBottom < 50 && hiddenOptions > 0) {
                setVisibleOptionsCount((prev) => prev + 20);
            }
        },
        [filteredAvailableOptions.length, visibleOptionsCount],
    );

    return (
        <DropdownMenu open={isOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10" onClick={() => setIsOpen(true)}>
                    {title}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56"
                onInteractOutside={() => {
                    setIsOpen(false);
                    setVisibleOptionsCount(20);
                }}
            >
                <DropdownMenuLabel>
                    <Button className="w-full" variant={"outline"} onClick={toggleAll}>
                        {availableOptions.find((option) => option.checked) ? "Desabilitar Todos" : "Habilitar Todos"}
                    </Button>
                </DropdownMenuLabel>
                <div onKeyDown={(e) => e.stopPropagation()}>
                    <Input
                        type="search"
                        placeholder="Buscar..."
                        className="w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        ref={inputRef}
                    />
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-[40dvh] overflow-y-auto" onScroll={handleScroll}>
                    {visibleOptions.map((option) => (
                        <DropdownMenuCheckboxItem
                            className="cursor-pointer"
                            key={option.label}
                            checked={option.checked}
                            onCheckedChange={(checked) => onCheckedChange(option.label, checked)}
                        >
                            {option.icon ? <i className={option.icon.className} style={option.icon.style}></i> : null}
                            {option.display || option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                    {filteredAvailableOptions.length === 0 && (
                        <DropdownMenuLabel className="text-center">Nenhum resultado encontrado</DropdownMenuLabel>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
