// src/page.tsx

"use client";

import MapFilter from "@/components/pages/FilteredMap";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { useState } from "react";
import PropertiesTable from "@/components/properties-table";

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

    return (
        <div className="w-[100%] h-[100%]">
            <MapFilter allProperties={allProperties} properties={properties} setProperties={setProperties} />
            <PropertiesTable properties={properties} />
        </div>
    );
}
