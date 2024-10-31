"use client";

import { GeocodedProperty } from "@/types/Property";
import { columns } from "./columns";
import { DataTable } from "./data-table";

type PropertiesTableProps = {
    properties: GeocodedProperty[];
};

export default function PropertiesTable(props: PropertiesTableProps) {
    const { properties } = props;
    return (
        <div className="container mx-auto py-10">
            <DataTable columns={columns} data={properties} />
        </div>
    );
}
