// src/page.tsx

"use client";

import Filter from "@/components/filter";
import MapContainer from "@/components/map/map-container";
import PropertiesTable from "@/components/properties-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="w-[100%] min-h-[100%] bg-muted pt-4">
            <Card className="m-4 mt-0">
                <CardHeader className="flex-row justify-between align-top">
                    <CardTitle>Mapa de Imóveis:</CardTitle>
                    <Button asChild className="!mt-0">
                        <Link href="/">
                            <MapIcon /> Ampliar Mapa
                        </Link>
                    </Button>
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
                    <Filter
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
