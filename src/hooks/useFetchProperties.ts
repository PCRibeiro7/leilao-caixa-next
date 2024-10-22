"use client";
import { GeocodedProperty } from "@/types/Property";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function useFetchProperties(): GeocodedProperty[] {
    const [cachedProperties, setCachedProperties] = useState<GeocodedProperty[]>([]);

    useEffect(() => {
        const supabase = createClient();
        async function fetchProperties() {
            const { count: propertiesCount } = await supabase
                .from("properties")
                .select("caixaId", { count: "exact", head: true });

            if (!propertiesCount) return [];

            const allProperties: GeocodedProperty[] = [];

            for (let i = 0; i < propertiesCount; i += 1000) {
                const { data: propertiesPage } = await supabase
                    .from("properties")
                    .select()
                    .range(i, i + 999);

                if (!propertiesPage) return allProperties;

                allProperties.push(...propertiesPage);
            }
            setCachedProperties(allProperties);
        }
        fetchProperties();
    }, []);

    return cachedProperties;
}
