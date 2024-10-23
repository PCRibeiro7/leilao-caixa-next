"use client";

import * as React from "react";
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

export type Checked = DropdownMenuCheckboxItemProps["checked"];

type DropdownMenuCheckboxesProps = {
    title: string;
    availableOptions: {
        label: string;
        display?: string;
        checked: Checked;
    }[];
    onCheckedChange: (label: string, checked: Checked) => void;
    toggleAll?: () => void;
};

export function DropdownMenuCheckboxes(props: DropdownMenuCheckboxesProps) {
    const { title, availableOptions, onCheckedChange, toggleAll } = props;

    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <DropdownMenu open={isOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" onClick={() => setIsOpen(true)}>
                    {title}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" onInteractOutside={() => setIsOpen(false)}>
                <DropdownMenuLabel onClick={toggleAll} className="cursor-pointer">
                    {availableOptions.find((option) => option.checked) ? "Desabilitar Todos" : "Habilitar Todos"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[50vh] overflow-y-auto">
                    {availableOptions.map((option) => (
                        <DropdownMenuCheckboxItem
                            className="cursor-pointer"
                            key={option.label}
                            checked={option.checked}
                            onCheckedChange={(checked) => onCheckedChange(option.label, checked)}
                        >
                            {option.display || option.label}
                        </DropdownMenuCheckboxItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
