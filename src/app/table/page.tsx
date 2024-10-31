// src/page.tsx

"use client";

import MapContainer from "@/components/map/MapContainer";
import MapFilter from "@/components/pages/MapFilter";
import PropertiesTable from "@/components/properties-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { Row } from "@tanstack/react-table";
import { Map } from "leaflet";
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
        window.scrollTo(0, 0);
        setSelectedProperty({
            old: selectedProperty.new,
            new: row.original,
        });
        map?.setView([row.original.latitude, row.original.longitude], 12);
    };

    return (
        <div className="w-[100%] h-[100%] bg-slate-100">
            <Card className="m-4">
                <CardHeader>
                    <CardTitle>Mapa de Imóveis:</CardTitle>
                </CardHeader>
                <CardContent className="w-[100%] h-[50dvh]">
                    <MapContainer
                        properties={properties}
                        showLegend={false}
                        map={map}
                        setMap={setMap}
                        selectedProperty={selectedProperty}
                    />
                </CardContent>
            </Card>
            <Card className="m-4">
                <CardHeader className="flex-row justify-between align-top">
                    <div>
                        <CardTitle>Lista de Imóveis:</CardTitle>
                        <CardDescription>{properties.length} imóveis encontrados para o filtro atual</CardDescription>
                    </div>
                    <MapFilter
                        allProperties={allProperties}
                        properties={properties}
                        setProperties={setProperties}
                        buttonClassName="!mt-0"
                    />
                </CardHeader>
                <CardContent>
                    <PropertiesTable properties={properties} onRowClick={handleRowClick} />
                </CardContent>
            </Card>
        </div>
    );
}
