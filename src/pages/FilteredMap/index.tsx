"use client";

import MapFilter from "@/components/filter";
import propertiesGeocoded from "@/data/properties-geocoded.jsonl";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

export default function FilteredMap() {
    const [properties, setProperties] = useState(propertiesGeocoded);

    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => <p>Carregando mapa...</p>,
                ssr: false,
            }),
        []
    );

    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%] overflow-y-clip" >
                <MapFilter allProperties={propertiesGeocoded} properties={properties} setProperties={setProperties} />
                <Map properties={properties} />
            </div>
        </>
    );
}
