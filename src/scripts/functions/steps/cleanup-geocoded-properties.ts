import { deleteAllProperties } from "@/services/properties";

export default async function cleanupGeocodedProperties() {
    await deleteAllProperties();
}
