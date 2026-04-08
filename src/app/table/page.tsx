// src/page.tsx

"use client";

import Filter from "@/components/filter";
import MapContainer from "@/components/map/map-container";
import PropertiesTable from "@/components/properties-table";
import { Button } from "@/components/ui/button";
import useFetchFilterOptions from "@/hooks/useFetchFilterOptions";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { PropertyFilters } from "@/types/PropertyFilters";
import { Row } from "@tanstack/react-table";
import { Map } from "leaflet";
import { MapIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

export type SelectedProperty = {
    old: GeocodedProperty | null;
    new: GeocodedProperty | null;
};

export default function Page() {
    const filterOptions = useFetchFilterOptions();
    const [filters, setFilters] = useState<PropertyFilters | null>(null);
    const { properties, loading } = useFetchProperties(filters);
    const [map, setMap] = useState<Map | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<SelectedProperty>({ old: null, new: null });

    const handleFiltersChange = useCallback((newFilters: PropertyFilters) => {
        setFilters(newFilters);
    }, []);

    if (!filterOptions) {
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
                        loading={loading}
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
                                {loading ? "—" : properties.length.toLocaleString("pt-BR")}
                            </span>{" "}
                            {loading ? "Buscando imóveis..." : "imóveis encontrados"}
                        </p>
                    </div>
                    <Filter
                        filterOptions={filterOptions}
                        onFiltersChange={handleFiltersChange}
                        propertyCount={properties.length}
                        loading={loading}
                        buttonClassName="!mt-0"
                    />
                </div>
                <div className="relative">
                    {loading && (
                        <div className="absolute top-0 left-0 right-0 z-10 h-1 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                            <div className="h-full w-1/3 rounded-full bg-zinc-900 dark:bg-white animate-[shimmer_1.2s_ease-in-out_infinite]" />
                        </div>
                    )}
                    <div className={loading ? "opacity-40 pointer-events-none transition-opacity duration-300" : "transition-opacity duration-300"}>
                        <PropertiesTable properties={properties} onRowClick={handleRowClick} />
                    </div>
                </div>
            </div>
        </div>
    );
}
