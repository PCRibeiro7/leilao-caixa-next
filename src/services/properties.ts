import { GeocodedProperty, Property } from "@/types/Property";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();
const PROPERTIES_TABLE_NAME = "properties";

export async function fetchAllProperties() {
    const { count: propertiesCount } = await supabase
        .from(PROPERTIES_TABLE_NAME)
        .select("caixaId", { count: "exact", head: true });

    if (!propertiesCount) return [];

    const allProperties: GeocodedProperty[] = [];

    for (let i = 0; i < propertiesCount; i += 1000) {
        const { data: propertiesPage } = await supabase
            .from(PROPERTIES_TABLE_NAME)
            .select()
            .range(i, i + 999);

        if (!propertiesPage) return allProperties;

        allProperties.push(...propertiesPage);
    }
    return allProperties;
}

export async function deleteProperties(caixaIds: string[]) {
    for (let i = 0; i < caixaIds.length; i += 500) {
        const { error } = await supabase
            .from(PROPERTIES_TABLE_NAME)
            .delete()
            .in("caixaId", caixaIds.slice(i, i + 500));

        if (error) throw error;
    }
}

export async function addProperty(property: GeocodedProperty) {
    const { error } = await supabase.from(PROPERTIES_TABLE_NAME).insert([property]);

    if (error) throw error;
}

export async function updateProperty(property: Property | GeocodedProperty) {
    const { error } = await supabase.from(PROPERTIES_TABLE_NAME).update(property).eq("caixaId", property.caixaId);

    if (error) throw error;
}

export async function deleteAllProperties() {
    const { error } = await supabase.from(PROPERTIES_TABLE_NAME).delete().neq("caixaId", 0);

    if (error) throw error;
}
