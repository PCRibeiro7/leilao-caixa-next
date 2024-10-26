// src/page.tsx

"use client";

import MapFilter from "@/pages/FilteredMap";
import MapContainer from "@/components/map/MapContainer";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
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

    return (
        <div className="bg-white-700 mx-auto w-[100%] h-[100%] overflow-y-clip">
            <MapContainer properties={properties} />
            <MapFilter allProperties={allProperties} properties={properties} setProperties={setProperties} />
        </div>
    );
}
