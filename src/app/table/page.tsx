// src/page.tsx

"use client";

import Filter from "@/components/filter";
import MapContainer from "@/components/map/map-container";
import PropertiesTable from "@/components/properties-table";
import { Button } from "@/components/ui/button";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { Row } from "@tanstack/react-table";
import { Map } from "leaflet";
import { MapIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type SelectedProperty = {
    old: GeocodedProperty | null;
    new: GeocodedProperty | null;
};

export default function Page() {
    const allProperties = useFetchProperties();
    const [properties, setProperties] = useState<GeocodedProperty[]>(allProperties);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<SelectedProperty>({ old: null, new: null });

    if (allProperties.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-2xl text-center">Carregando imóveis...</p>
            </div>
        );
    }

    const handleRowClick = (row: Row<GeocodedProperty>) => {
        setSelectedProperty({
            old: selectedProperty.new,
            new: row.original,
        });
    };

    return (
        <div className="w-full min-h-full bg-zinc-50 dark:bg-zinc-950">
            {/* Map section */}
            <div className="border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between px-5 py-3">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mapa</h2>
                    <Button variant="outline" size="sm" asChild className="gap-2 rounded-lg">
                        <Link href="/">
                            <MapIcon className="w-4 h-4" /> Ampliar Mapa
                        </Link>
                    </Button>
                </div>
                <div className="w-full h-[40dvh]">
                    <MapContainer
                        properties={properties}
                        showLegend={false}
                        map={map}
                        setMap={setMap}
                        selectedProperty={selectedProperty}
                    />
                </div>
            </div>

            {/* Table section */}
            <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Lista de Imóveis</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {properties.length.toLocaleString("pt-BR")}
                            </span>{" "}
                            imóveis encontrados
                        </p>
                    </div>
                    <Filter
                        allProperties={allProperties}
                        properties={properties}
                        setProperties={setProperties}
                        buttonClassName="!mt-0"
                    />
                </div>
                <PropertiesTable properties={properties} onRowClick={handleRowClick} />
            </div>
        </div>
    );
}
