import { deletePhoto, listFiles } from "@/services/photos";
import { fetchAllProperties } from "@/services/properties";

export default async function deleteOrphanPhotos() {
    console.log("Fetching all photos from storage...");
    const files = await listFiles();

    if (!files || files.length === 0) {
        console.log("No photos found in storage.");
        return;
    }

    console.log(`Found ${files.length} photos in storage.`);

    console.log("Fetching all properties...");
    const properties = await fetchAllProperties();
    const propertyCaixaIds = new Set(properties.map((p) => p.caixaId));
    console.log(`Found ${properties.length} properties.`);

    const orphanedPhotoIds = files
        .map((file) => file.name.replace(".jpg", ""))
        .filter((photoId) => !propertyCaixaIds.has(photoId));

    if (orphanedPhotoIds.length === 0) {
        console.log("No orphaned photos found.");
        return;
    }

    console.log(`Found ${orphanedPhotoIds.length} orphaned photos. Deleting...`);

    const BATCH_SIZE = 500;
    for (let i = 0; i < orphanedPhotoIds.length; i += BATCH_SIZE) {
        const batch = orphanedPhotoIds.slice(i, i + BATCH_SIZE);
        await deletePhoto(batch);
        console.log(`Deleted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} photos)`);
    }

    console.log(`Done. Deleted ${orphanedPhotoIds.length} orphaned photos.`);
}
