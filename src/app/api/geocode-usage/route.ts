import { fetchMonthlyGeocodeRequestCount, MONTHLY_LIMIT } from "@/scripts/utils/google-geocode-usage";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const count = await fetchMonthlyGeocodeRequestCount();
        const usage = {
            count,
            limit: MONTHLY_LIMIT,
            remaining: Math.max(0, MONTHLY_LIMIT - count),
        };

        return NextResponse.json(usage);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch Google Geocoding usage.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
