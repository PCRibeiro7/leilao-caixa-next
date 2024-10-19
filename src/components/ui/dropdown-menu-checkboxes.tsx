"use client";

import * as React from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Checked = DropdownMenuCheckboxItemProps["checked"];

type DropdownMenuCheckboxesProps = {
    title: string;
    availableOptions: {
        label: string;
        checked: Checked;
    }[];
    onCheckedChange: (label: string, checked: Checked) => void;
};

export function DropdownMenuCheckboxes(props: DropdownMenuCheckboxesProps) {
    const { title, availableOptions, onCheckedChange } = props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">{title}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                {availableOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                        key={option.label}
                        checked={option.checked}
                        onCheckedChange={(checked) => onCheckedChange(option.label, checked)}
                    >
                        {option.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
