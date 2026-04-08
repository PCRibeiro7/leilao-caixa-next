import { FilterOptions } from "@/types/PropertyFilters";
import { createClient } from "@/utils/supabase/server";
import moment from "moment";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = createClient();

    const { count } = await supabase.from("properties").select("caixaId", { count: "exact", head: true });

    if (!count) {
        return NextResponse.json<FilterOptions>({
            states: [],
            cities: [],
            neighborhoods: [],
            sellingTypes: [],
            types: [],
            createdAtDates: [],
            geocodePrecisions: [],
            minPrice: 0,
            maxPrice: 0,
            minDiscount: 0,
        });
    }

    const allRows: {
        state: string;
        city: string;
        neighborhood: string;
        sellingType: string;
        type: string;
        price: number;
        discount: number;
        createdAt: string;
        geocodePrecision: string;
    }[] = [];

    for (let i = 0; i < count; i += 1000) {
        const { data } = await supabase
            .from("properties")
            .select("state, city, neighborhood, sellingType, type, price, discount, createdAt, geocodePrecision")
            .range(i, i + 999);

        if (data) allRows.push(...data);
    }

    const states = [...new Set(allRows.map((r) => r.state))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

    const cityMap = new Map<string, { city: string; state: string }>();
    for (const r of allRows) {
        if (r.city) cityMap.set(`${r.state}|${r.city}`, { city: r.city, state: r.state });
    }
    const cities = [...cityMap.values()].sort((a, b) => a.city.localeCompare(b.city));

    const neighborhoodMap = new Map<string, { neighborhood: string; city: string; state: string }>();
    for (const r of allRows) {
        if (r.neighborhood) {
            neighborhoodMap.set(`${r.state}|${r.city}|${r.neighborhood}`, {
                neighborhood: r.neighborhood,
                city: r.city,
                state: r.state,
            });
        }
    }
    const neighborhoods = [...neighborhoodMap.values()].sort((a, b) =>
        a.neighborhood.localeCompare(b.neighborhood),
    );

    const sellingTypes = [...new Set(allRows.map((r) => r.sellingType))].filter(Boolean);
    const types = [...new Set(allRows.map((r) => r.type))].filter(Boolean);

    const prices = allRows.map((r) => r.price).filter(Boolean);
    const discounts = allRows.map((r) => r.discount || 0);

    const createdAtDates = [
        ...new Set(
            allRows
                .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0))
                .map((r) => moment(r.createdAt).format("DD/MM/YYYY")),
        ),
    ].filter(Boolean);

    const geocodePrecisions = [...new Set(allRows.map((r) => r.geocodePrecision))].filter(Boolean);

    return NextResponse.json<FilterOptions>({
        states,
        cities,
        neighborhoods,
        sellingTypes,
        types,
        createdAtDates,
        geocodePrecisions,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
        minDiscount: discounts.length > 0 ? Math.min(...discounts) : 0,
    });
}
