import { createClient } from "@/utils/supabase/client";
import "dotenv/config";

const supabase = createClient();
const BUCKET_NAME = "tmp-files";

export async function uploadTmpFile(fileName: string, content: string): Promise<void> {
    const buffer = Buffer.from(content, "latin1");
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, buffer, {
        upsert: true,
        contentType: "application/octet-stream",
    });

    if (error) {
        throw new Error(`Failed to upload ${fileName}: ${error.message}`);
    }
}

export async function downloadTmpFile(fileName: string): Promise<string | undefined> {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fileName);

    if (error) {
        console.log(`File ${fileName} not found in storage`);
        return undefined;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return buffer.toString("latin1");
}
