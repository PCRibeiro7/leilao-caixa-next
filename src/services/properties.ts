import { Tables } from "@/types/database";
import { GeocodedProperty, Property } from "@/types/Property";
import { createAdminClient } from "@/utils/supabase/admin";

const supabase = createAdminClient();
const PROPERTIES_TABLE_NAME = "properties";

export async function fetchAllProperties<Fields extends keyof Tables<"properties">>(fields?: Fields[]): Promise<Pick<Tables<"properties">, Fields>[]> {
    const { count: propertiesCount } = await supabase
        .from(PROPERTIES_TABLE_NAME)
        .select("caixaId", { count: "exact", head: true });

    if (!propertiesCount) return [];

    const allProperties: Pick<Tables<"properties">, Fields>[] = [];

    for (let i = 0; i < propertiesCount; i += 1000) {
        const selectFields = fields?.join(", ");
        const query = selectFields
            ? supabase.from(PROPERTIES_TABLE_NAME).select(selectFields)
            : supabase.from(PROPERTIES_TABLE_NAME).select();
        // An explicit order is required for range pagination to be deterministic;
        // without it, rows can be duplicated or skipped across pages.
        const { data: propertiesPage } = await query.order("caixaId").range(i, i + 999);

        if (!propertiesPage) return allProperties;

        allProperties.push(...(propertiesPage as Pick<Tables<"properties">, Fields>[]));
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
    const { error } = await supabase
        .from(PROPERTIES_TABLE_NAME)
        .upsert([property], { onConflict: "caixaId", ignoreDuplicates: true });

    if (error) throw error;
}

export async function updateProperty(property: Property | GeocodedProperty) {
    const { error } = await supabase.from(PROPERTIES_TABLE_NAME).update(property).eq("caixaId", property.caixaId);

    if (error) throw error;
}

export async function deleteAllProperties() {
    const { error } = await supabase.from(PROPERTIES_TABLE_NAME).delete().neq("caixaId", "0");

    if (error) throw error;
}
