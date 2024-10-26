import { PROPERTIES_PATH } from "@/consts/filePaths";
import { updateProperty } from "@/services/properties";
import { Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import "dotenv/config";

async function setBaseProperties(): Promise<void> {
    const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) console.log(`Updating property ${index} of ${properties.length}`);
        await updateProperty(property);
    }
}

export default setBaseProperties;
