"use client";

import { MapProps } from "@/components/map/";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapContainer(props: MapProps) {
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => <p>Carregando mapa...</p>,
                ssr: false,
            }),
        []
    );

    return <Map {...props} />;
}
