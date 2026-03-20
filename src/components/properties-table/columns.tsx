"use client";

import { GeocodedProperty } from "@/types/Property";
import { ColumnDef, SortingColumn } from "@tanstack/react-table";
import { Button } from "../ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";

export function getArea(property: GeocodedProperty) {
    if (property.totalArea) {
        return property.totalArea;
    }
    if (property.builtArea) {
        return property.builtArea;
    }
    return property.landArea;
}

type HeaderButtonProps = {
    header: string;
    column: SortingColumn<GeocodedProperty>;
};

const HeaderButton = ({ header, column }: HeaderButtonProps) => (
    <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
        {header}
        <CaretSortIcon className="ml-1 h-3.5 w-3.5" />
    </Button>
);

export const columns: ColumnDef<GeocodedProperty>[] = [
    {
        accessorKey: "address",
        header: ({ column }) => <HeaderButton column={column} header="Endereço" />,
        size: 400,
        cell: ({ row }) => (
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.getValue("address")}</span>
        ),
    },
    {
        accessorKey: "city",
        header: ({ column }) => <HeaderButton column={column} header="Cidade" />,
    },
    {
        accessorKey: "neighborhood",
        header: ({ column }) => <HeaderButton column={column} header="Bairro" />,
    },
    {
        accessorKey: "type",
        header: ({ column }) => <HeaderButton column={column} header="Tipo de Imóvel" />,
        cell: ({ row }) => (
            <span className="inline-flex items-center rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {row.getValue("type")}
            </span>
        ),
    },
    {
        accessorKey: "sellingType",
        header: ({ column }) => <HeaderButton column={column} header="Tipo de Venda" />,
        cell: ({ row }) => (
            <span className="text-zinc-500 dark:text-zinc-400 text-xs">{row.getValue("sellingType")}</span>
        ),
    },
    {
        accessorKey: "priceAsCurrency",
        header: ({ column }) => <HeaderButton column={column} header="Preço" />,
        cell: ({ row }) => (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {row.getValue("priceAsCurrency")}
            </span>
        ),
    },
    {
        accessorKey: "discount",
        header: ({ column }) => <HeaderButton column={column} header="Desconto" />,
        accessorFn: (property) => property.discount,
        cell: ({ row }) => {
            const discount = row.getValue("discount") as number;
            return (
                <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-950 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 tabular-nums">
                    -{discount}%
                </span>
            );
        },
    },
    {
        accessorKey: "totalArea",
        accessorFn: (property) => getArea(property),
        header: ({ column }) => <HeaderButton column={column} header="Área" />,
        cell: ({ row }) => (
            <span className="tabular-nums text-zinc-600 dark:text-zinc-300">{row.getValue("totalArea")} m²</span>
        ),
    },
];
