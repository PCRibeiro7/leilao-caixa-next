"use client";

import { GeocodedProperty } from "@/types/Property";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { Row } from "@tanstack/react-table";

type PropertiesTableProps = {
    properties: GeocodedProperty[];
    onRowClick?: (row: Row<GeocodedProperty>) => void;
};

export default function PropertiesTable(props: PropertiesTableProps) {
    const { properties, onRowClick } = props;
    return <DataTable columns={columns} data={properties} onRowClick={onRowClick} />;
}
