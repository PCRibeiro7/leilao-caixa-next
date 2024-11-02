import { createClient } from "@/utils/supabase/client";
import axios from "axios";
import { decode } from "base64-arraybuffer";
import "dotenv/config";

const supabase = createClient();
const PHOTO_BUCKET_NAME = "photos";

export async function getImage(caixaId: string) {
    const imageId = `${caixaId}21`.padStart(15, "0");
    const imageUrl = `https://venda-imoveis.caixa.gov.br/fotos/F${imageId}.jpg`;
    try {
        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });
        const base64 = Buffer.from(response.data).toString("base64");
        return base64;
    } catch {
        console.error(`Error fetching image for property: ${caixaId}`, imageUrl);
    }
}

export async function uploadPhoto(photoId: string, base64Content: string) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET_NAME).upload(`${photoId}.jpg`, decode(base64Content), {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/jpg",
    });

    if (error) {
        console.log(`Failed to upload photo ${photoId}`);
    }
}

export async function deletePhoto(photoIds: string[]) {
    const { error } = await supabase.storage.from(PHOTO_BUCKET_NAME).remove(photoIds.map((id) => `${id}.jpg`));

    if (error) {
        console.log("Failed to delete photos");
    }
}

export async function listFiles() {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET_NAME).list("", {
        limit: 100000,
    });

    if (error) {
        console.log("Failed to list files");
    }

    return data;
}
