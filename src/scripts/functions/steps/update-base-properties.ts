import { PROPERTIES_PATH } from "@/consts/filePaths";
import { getImage, listFiles, uploadPhoto } from "@/services/photos";
import { Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import "dotenv/config";
import safetyCheck from "./safety-check";
import { updateProperty } from "@/services/properties";

async function setBaseProperties(): Promise<void> {
    const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];

    const shouldUpdatePhotos = await safetyCheck("Are you sure you want to update the photos?", "return");

    if (shouldUpdatePhotos) {
        const files = await listFiles();
        const fileNames = files?.map((file) => file.name.split(".")[0]);

        const missingPhotosProperties = properties.filter((property) => !fileNames?.includes(property.caixaId));
        console.log(`Found ${fileNames?.length} files`);

        for (const [index, property] of missingPhotosProperties.entries()) {
            if (index % 100 === 0) console.log(`Updating photo ${index} of ${missingPhotosProperties.length}`);

            const base64 = await getImage(property.caixaId);
            if (!base64) continue;
            await uploadPhoto(property.caixaId, base64);
        }
    }

    const shouldUpdateProperties = await safetyCheck("Are you sure you want to update the base properties?", "return");

    if (!shouldUpdateProperties) return;

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) console.log(`Updating property ${index} of ${properties.length}`);
        await updateProperty(property);
    }
}

export default setBaseProperties;
