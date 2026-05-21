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

type DropdownMenuCheckboxOption = {
    label: string;
    display?: string;
    checked: Checked;
    icon?: {
        style?: CSSProperties;
        className?: string;
    };
};

type DropdownMenuCheckboxGroup = {
    label: string;
    options: DropdownMenuCheckboxOption[];
    toggleAll?: () => void;
};

type DropdownMenuCheckboxesProps = {
    title: string;
    availableOptions?: DropdownMenuCheckboxOption[];
    groups?: DropdownMenuCheckboxGroup[];
    onCheckedChange: (label: string, checked: Checked) => void;
    toggleAll?: () => void;
};

export function DropdownMenuCheckboxes(props: DropdownMenuCheckboxesProps) {
    const { title, availableOptions = [], groups, onCheckedChange, toggleAll } = props;
    const [visibleOptionsCount, setVisibleOptionsCount] = useState(20);

    const inputRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const allOptions = groups ? groups.flatMap((group) => group.options) : availableOptions;
    const matchesSearch = (option: DropdownMenuCheckboxOption) =>
        search ? option.label.toLowerCase().includes(search.toLowerCase()) : true;

    const filteredAvailableOptions = allOptions.filter(matchesSearch);

    const filteredGroups = groups
        ?.map((group) => ({
            ...group,
            allOptions: group.options,
            options: group.options.filter(matchesSearch),
        }))
        .filter((group) => group.options.length > 0);

    let remainingVisibleOptions = visibleOptionsCount;
    const visibleGroups = filteredGroups
        ?.map((group) => {
            const options = group.options.slice(0, remainingVisibleOptions);
            remainingVisibleOptions -= options.length;

            return {
                ...group,
                options,
            };
        })
        .filter((group) => group.options.length > 0);

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
                        {allOptions.find((option) => option.checked) ? "Desabilitar Todos" : "Habilitar Todos"}
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
                    {visibleGroups
                        ? visibleGroups.map((group, groupIndex) => (
                              <div key={group.label}>
                                  {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                                  <DropdownMenuLabel className="space-y-2">
                                      <span>{group.label}</span>
                                      {group.toggleAll ? (
                                          <Button className="w-full" variant="outline" onClick={group.toggleAll}>
                                              {group.allOptions.find((option) => option.checked)
                                                  ? `Desabilitar ${group.label}`
                                                  : `Habilitar ${group.label}`}
                                          </Button>
                                      ) : null}
                                  </DropdownMenuLabel>
                                  {group.options.map((option) => (
                                      <DropdownMenuCheckboxItem
                                          className="cursor-pointer"
                                          key={option.label}
                                          checked={option.checked}
                                          onCheckedChange={(checked) => onCheckedChange(option.label, checked)}
                                      >
                                          {option.icon ? (
                                              <i className={option.icon.className} style={option.icon.style}></i>
                                          ) : null}
                                          {option.display || option.label}
                                      </DropdownMenuCheckboxItem>
                                  ))}
                              </div>
                          ))
                        : visibleOptions.map((option) => (
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
