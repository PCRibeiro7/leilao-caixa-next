"use client";

import MapFilter from "@/components/filter";
import MapContainer from "@/components/map/container";
import useFetchProperties from "@/hooks/useFetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { useState } from "react";

export default function FilteredMap() {
    const allProperties = useFetchProperties();
    const [properties, setProperties] = useState<GeocodedProperty[]>(allProperties);

    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%] overflow-y-clip">
                <MapFilter allProperties={allProperties} properties={properties} setProperties={setProperties} />
                <MapContainer properties={properties} />
            </div>
        </>
    );
}
