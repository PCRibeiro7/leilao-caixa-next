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
        <div className="w-full h-full overflow-y-clip relative">
            <MapContainer properties={properties} showLegend={false} map={map} setMap={setMap} />

            {/* Top bar */}
            <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 md:px-4 md:py-3 pointer-events-none">
                <div className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl shadow-lg px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 border border-white/30 dark:border-zinc-700/50 ml-10">
                    <span className="font-bold text-zinc-900 dark:text-white">
                        {properties.length.toLocaleString("pt-BR")}
                    </span>{" "}
                    imóveis
                </div>
                <Button
                    className="pointer-events-auto bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg border border-white/30 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 hover:bg-white/95 dark:hover:bg-zinc-800/95 rounded-xl h-9 px-4 gap-2"
                    variant="ghost"
                    asChild
                >
                    <Link href="/table">
                        <TableIcon className="w-4 h-4" /> Ver em Tabela
                    </Link>
                </Button>
            </div>

            {/* Filter button */}
            <Filter
                allProperties={allProperties}
                properties={properties}
                setProperties={setProperties}
                buttonClassName="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 md:w-auto px-8 py-3 text-base rounded-full shadow-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all"
            />
        </div>
    );
}
