// src/page.tsx

"use client";

import MapFilter from "@/components/filter";
import { GeocodedProperty } from "@/types/Property";
import propertiesGeocodedData from "@/data/properties-geocoded.jsonl";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

export default function FilteredMap() {
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => <p>A map is loading</p>,
                ssr: false,
            }),
        []
    );

    const propertiesGeocoded = propertiesGeocodedData as GeocodedProperty[];
    const [properties, setProperties] = useState(propertiesGeocoded);


    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%]">
                <MapFilter allProperties={propertiesGeocoded} properties={properties} setProperties={setProperties} />
                <Map properties={properties} />
            </div>
        </>
    );
}
