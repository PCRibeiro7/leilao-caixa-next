import { PROPERTIES_FILENAME } from "@/consts/filePaths";
import { Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import { updateProperty } from "@/services/properties";
import safetyPrompt from "@/scripts/utils/safety-prompt";
import "dotenv/config";

export default async function upsertBaseProperties(): Promise<void> {
    const properties = (await readJsonlFileAsJsonArray<Property>(PROPERTIES_FILENAME)) || [];

    const shouldUpdateProperties = await safetyPrompt("Are you sure you want to update the base properties?", "return");

    if (!shouldUpdateProperties) return;

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) console.log(`Updating property ${index} of ${properties.length}`);
        await updateProperty(property);
    }
}
