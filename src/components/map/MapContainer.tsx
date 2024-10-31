"use client";

import { MapProps } from "@/components/map/";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapContainer(props: MapProps) {
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-2xl text-center">Carregando mapa...</p>
                    </div>
                ),
                ssr: false,
            }),
        []
    );

    return <Map {...props} />;
}
