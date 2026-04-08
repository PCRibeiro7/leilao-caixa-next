import { PropertyFilters } from "@/types/PropertyFilters";
import { GeocodedProperty } from "@/types/Property";
import { createClient } from "@/utils/supabase/server";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, filters: PropertyFilters) {
    if (filters.minPrice > 0) {
        query = query.gte("price", filters.minPrice);
    }
    if (filters.maxPrice > 0) {
        query = query.lte("price", filters.maxPrice);
    }
    if (filters.minDiscount > 0) {
        query = query.gte("discount", filters.minDiscount);
    }
    if (filters.sellingType.length > 0) {
        query = query.in("sellingType", filters.sellingType);
    }
    if (filters.type.length > 0) {
        query = query.in("type", filters.type);
    }
    if (filters.state.length > 0) {
        query = query.in("state", filters.state);
    }
    if (filters.city.length > 0) {
        query = query.in("city", filters.city);
    }
    if (filters.neighborhood.length > 0) {
        query = query.in("neighborhood", filters.neighborhood);
    }
    if (filters.geocodePrecision.length > 0) {
        query = query.in("geocodePrecision", filters.geocodePrecision);
    }
    if (filters.createdAtDate.length > 0) {
        const dateConditions = filters.createdAtDate
            .map((dateStr) => {
                const parsed = moment(dateStr, "DD/MM/YYYY");
                if (!parsed.isValid()) return null;
                const start = parsed.startOf("day").toISOString();
                const end = parsed.clone().endOf("day").toISOString();
                return `and(createdAt.gte.${start},createdAt.lte.${end})`;
            })
            .filter(Boolean);

        if (dateConditions.length > 0) {
            query = query.or(dateConditions.join(","));
        }
    }
    return query;
}

export async function POST(request: NextRequest) {
    const filters: PropertyFilters = await request.json();
    const supabase = createClient();

    const countQuery = applyFilters(
        supabase.from("properties").select("caixaId", { count: "exact", head: true }),
        filters,
    );
    const { count } = await countQuery;
    const totalCount = count || 0;

    if (totalCount === 0) {
        return NextResponse.json([]);
    }

    const allProperties: GeocodedProperty[] = [];

    for (let i = 0; i < totalCount; i += 1000) {
        const pageQuery = applyFilters(supabase.from("properties").select("caixaId, latitude, longitude"), filters);
        const { data } = await pageQuery.range(i, i + 999);
        if (!data) break;
        allProperties.push(...data);
    }

    return NextResponse.json(allProperties);
}
