import { fetchAllProperties } from "@/services/properties";
import { createClient } from "@/utils/supabase/client";
import { schedule } from "@netlify/functions";

const BUCKET_NAME = "properties-backups";
const RETENTION_DAYS = 3;

// Runs once a day at 03:00 UTC
export const handler = schedule("0 3 * * *", async () => {
    const supabase = createClient();

    console.log("Starting daily properties backup...");

    // 1. Fetch all current properties
    const properties = await fetchAllProperties();
    console.log(`Fetched ${properties.length} properties.`);

    if (properties.length === 0) {
        console.log("No properties found. Skipping backup.");
        return { statusCode: 200, body: "No properties to backup." };
    }

    // 2. Upload backup as JSON to Supabase Storage
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // e.g. 2026-03-25
    const fileName = `backup-${dateStr}.json`;

    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, JSON.stringify(properties), {
            contentType: "application/json",
            upsert: true,
        });

    if (uploadError) {
        console.error("Failed to upload backup:", uploadError);
        return { statusCode: 500, body: `Backup upload failed: ${uploadError.message}` };
    }

    console.log(`Backup uploaded: ${fileName}`);

    // 3. Prune backups older than retention period
    const { data: files, error: listError } = await supabase.storage.from(BUCKET_NAME).list();

    if (listError) {
        console.error("Failed to list backups:", listError);
        return { statusCode: 200, body: "Backup saved but failed to prune old backups." };
    }

    const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filesToDelete = (files || [])
        .filter((file) => {
            const match = file.name.match(/^backup-(\d{4}-\d{2}-\d{2})\.json$/);
            if (!match) return false;
            return new Date(match[1]) < cutoffDate;
        })
        .map((file) => file.name);

    if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);

        if (deleteError) {
            console.error("Failed to delete old backups:", deleteError);
        } else {
            console.log(`Pruned ${filesToDelete.length} old backup(s): ${filesToDelete.join(", ")}`);
        }
    } else {
        console.log("No old backups to prune.");
    }

    return { statusCode: 200, body: `Backup complete: ${fileName}` };
});
