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
    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        {header}
        <CaretSortIcon className="ml-2 h-4 w-4" />
    </Button>
);

export const columns: ColumnDef<GeocodedProperty>[] = [
    {
        accessorKey: "address",
        header: ({ column }) => <HeaderButton column={column} header="Endereço" />,
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
    },
    {
        accessorKey: "sellingType",
        header: ({ column }) => <HeaderButton column={column} header="Tipo de Venda" />,
    },
    {
        accessorKey: "priceAsCurrency",
        header: ({ column }) => <HeaderButton column={column} header="Preço" />,
    },
    {
        accessorKey: "discount",
        header: ({ column }) => <HeaderButton column={column} header="Desconto" />,
    },
    {
        accessorKey: "totalArea",
        accessorFn: (property) => getArea(property) + " m²",
        header: ({ column }) => <HeaderButton column={column} header="Área" />,
    },
];
