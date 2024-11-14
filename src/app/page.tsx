// src/page.tsx

"use client";

import Filter from "@/components/filter";
import MapContainer from "@/components/map/map-container";
import { Button } from "@/components/ui/button";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { TableIcon } from "@radix-ui/react-icons";
import { Map } from "leaflet";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
    const allProperties = useFetchProperties();
    const [properties, setProperties] = useState<GeocodedProperty[]>(allProperties);
    const [map, setMap] = useState<Map | null>(null);

    if (allProperties.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-2xl text-center">Carregando imóveis...</p>
            </div>
        );
    }

    return (
        <div className="w-[100%] h-[100%] overflow-y-clip relative">
            <MapContainer properties={properties} showLegend={true} map={map} setMap={setMap} />
            <Button className="fixed top-0 right-0 z-10 m-[4px] md:m-[10px]" asChild>
                <Link href="/table">
                    <TableIcon /> Ver em Tabela
                </Link>
            </Button>
            <Filter
                allProperties={allProperties}
                properties={properties}
                setProperties={setProperties}
                buttonClassName="md:w-1/4 m-[4px] md:m-[10px] text-base fixed bottom-0 md:mr-auto md:ml-auto left-0 right-0 z-10"
            />
        </div>
    );
}
