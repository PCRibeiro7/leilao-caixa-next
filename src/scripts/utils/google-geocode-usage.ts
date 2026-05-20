import { MetricServiceClient } from "@google-cloud/monitoring";
import fs from "fs";
import os from "os";
import path from "path";
import "dotenv/config";

export const MONTHLY_LIMIT = 10_000;

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
 * Fetches the total Geocoding API request count for the current calendar month.
 * Throws an error if GOOGLE_CLOUD_PROJECT_ID is not set.
 */
export async function fetchMonthlyGeocodeRequestCount(): Promise<number> {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    if (!projectId) {
        throw new Error("GOOGLE_CLOUD_PROJECT_ID not set — cannot sync usage from Google Cloud Monitoring.");
    }

    ensureCredentialsFile();

    const client = new MetricServiceClient();
    const now = new Date();
    // Google resets monthly quotas at midnight Pacific Time (America/Los_Angeles)
    const utcRef = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const ptRef = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const ptOffsetMs = ptRef.getTime() - utcRef.getTime();
    const startOfMonth = new Date(Date.UTC(ptRef.getFullYear(), ptRef.getMonth(), 1) - ptOffsetMs);

    try {
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

        return total;
    } finally {
        // The gRPC channel keeps the Node event loop active until its idle
        // timeout expires. On Lambda this can delay container freeze by tens
        // of seconds, so close it explicitly as soon as we're done.
        await client.close();
    }
}

/**
 * Syncs the monthly request count from Google Cloud Monitoring and resets the run count.
 * Should be called at the start of each run to ensure accurate tracking of usage within the monthly quota.
 */
export async function syncGoogleGeocodeUsage(): Promise<void> {
    const total = await fetchMonthlyGeocodeRequestCount();

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
