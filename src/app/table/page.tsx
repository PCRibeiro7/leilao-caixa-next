// src/page.tsx

"use client";

import MapContainer from "@/components/map/MapContainer";
import MapFilter from "@/components/pages/MapFilter";
import PropertiesTable from "@/components/properties-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { Row } from "@tanstack/react-table";
import { useState } from "react";

export default function Page() {
    const allProperties = useFetchProperties();
    const [properties, setProperties] = useState<GeocodedProperty[]>(allProperties);

    if (allProperties.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-2xl text-center">Carregando imóveis...</p>
            </div>
        );
    }

    const handleRowClick = (row: Row<GeocodedProperty>) => {
        console.log(row);
    };

    return (
        <div className="w-[100%] h-[100%]">
            <Card className="m-4">
                <CardHeader>
                    <CardTitle>Mapa de Imóveis:</CardTitle>
                    <CardDescription>{properties.length} imóveis encontrados para o filtro atual</CardDescription>
                </CardHeader>
                <CardContent className="w-[100%] h-[50dvh]">
                    <MapContainer properties={properties} showLegend={false} />
                </CardContent>
            </Card>
            <Card className="m-4">
                <CardHeader>
                    <CardTitle>Lista de Imóveis:</CardTitle>
                    <CardDescription>{properties.length} imóveis encontrados para o filtro atual</CardDescription>
                </CardHeader>
                <CardContent>
                    <PropertiesTable properties={properties} onRowClick={handleRowClick} />
                </CardContent>
            </Card>
            <MapFilter allProperties={allProperties} properties={properties} setProperties={setProperties} />
        </div>
    );
}
