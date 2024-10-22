"use client";

import MapFilter from "@/components/filter";
import MapContainer from "@/components/map/container";
// import propertiesGeocoded from "@/data/properties-geocoded.jsonl";
import fetchProperties from "@/hooks/fetchProperties";
import { GeocodedProperty } from "@/types/Property";
import { useState } from "react";

import { useEffect } from "react";

export default function FilteredMap() {
    const [allProperties, setAllProperties] = useState<GeocodedProperty[]>([]);
    const [properties, setProperties] = useState<GeocodedProperty[]>([]);

    useEffect(() => {
        async function fetchData() {
            const propertiesGeocoded = await fetchProperties();
            setAllProperties(propertiesGeocoded || []);
        }
        fetchData();
    }, []);

    useEffect(() => {
        setProperties(allProperties);
    },[allProperties]);

    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%] overflow-y-clip">
                <MapFilter allProperties={allProperties} properties={properties} setProperties={setProperties} />
                <MapContainer properties={properties} />
            </div>
        </>
    );
}
