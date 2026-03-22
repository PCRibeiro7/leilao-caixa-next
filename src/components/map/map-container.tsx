"use client";

import { MapProps } from "@/components/map/";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function MapContainer(props: MapProps) {
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => (
                    <div className="flex flex-col justify-center items-center h-full gap-3 bg-zinc-50 dark:bg-zinc-950">
                        <div className="w-10 h-10 rounded-full border-[3px] border-zinc-200 dark:border-zinc-700 border-t-zinc-600 dark:border-t-zinc-300 animate-spin" />
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Carregando mapa...</p>
                    </div>
                ),
                ssr: false,
            }),
        [],
    );

    return <Map {...props} />;
}
