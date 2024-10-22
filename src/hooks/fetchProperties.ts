"use server";
import { GeocodedProperty } from "@/types/Property";
import { createClient } from "@/utils/supabase/server";

export default async function fetchProperties(): Promise<GeocodedProperty[]> {
    const supabase = createClient();

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

    return allProperties;
}
