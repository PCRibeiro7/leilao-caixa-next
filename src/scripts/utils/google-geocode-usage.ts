import { MetricServiceClient } from "@google-cloud/monitoring";
import fs from "fs";
import os from "os";
import path from "path";
import "dotenv/config";

const MONTHLY_LIMIT = 10_000;

// Tracks requests made *during this run* (since Google Monitoring has a ~3-5 min delay)
let runRequestCount = 0;
// Cached count fetched from Google at sync time
let syncedMonthlyCount: number | null = null;

/**
 * If GOOGLE_APPLICATION_CREDENTIALS is not set but GOOGLE_APPLICATION_CREDENTIALS_JSON is,
 * write the JSON to a temp file and point the env var at it.
 * This allows storing the service account key as a Netlify env var string.
 */
function ensureCredentialsFile(): void {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

    const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!json) return;

    const tmpPath = path.join(os.tmpdir(), "gcloud-service-account.json");
    fs.writeFileSync(tmpPath, json, { mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
}

/**
 * Queries Google Cloud Monitoring for the total Geocoding API request count
 * in the current calendar month. Call once at the start of a geocoding batch.
 */
export async function syncGoogleGeocodeUsage(): Promise<void> {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    if (!projectId) {
        console.warn("GOOGLE_CLOUD_PROJECT_ID not set — cannot sync usage from Google Cloud Monitoring.");
        return;
    }

    ensureCredentialsFile();

    const client = new MetricServiceClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [timeSeries] = await client.listTimeSeries({
        name: `projects/${projectId}`,
        filter:
            'metric.type="serviceruntime.googleapis.com/api/request_count" ' +
            'AND resource.labels.service="geocoding-backend.googleapis.com"',
        interval: {
            startTime: { seconds: Math.floor(startOfMonth.getTime() / 1000) },
            endTime: { seconds: Math.floor(now.getTime() / 1000) },
        },
        aggregation: {
            alignmentPeriod: { seconds: Math.floor((now.getTime() - startOfMonth.getTime()) / 1000) },
            perSeriesAligner: "ALIGN_SUM",
            crossSeriesReducer: "REDUCE_SUM",
        },
    });

    let total = 0;
    for (const series of timeSeries) {
        for (const point of series.points || []) {
            total += Number(point.value?.int64Value ?? point.value?.doubleValue ?? 0);
        }
    }

    syncedMonthlyCount = total;
    runRequestCount = 0;
    console.log(`Google Geocoding usage synced: ${total} requests this month (limit: ${MONTHLY_LIMIT})`);
}

export function getGoogleGeocodeUsage(): { count: number; limit: number; remaining: number } {
    const count = (syncedMonthlyCount ?? 0) + runRequestCount;
    return {
        count,
        limit: MONTHLY_LIMIT,
        remaining: Math.max(0, MONTHLY_LIMIT - count),
    };
}

export function canMakeGoogleGeocodeRequest(): boolean {
    return getGoogleGeocodeUsage().remaining > 0;
}

export function incrementGoogleGeocodeCount(): void {
    runRequestCount++;
}
