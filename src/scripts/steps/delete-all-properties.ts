import { deleteAllProperties } from "@/services/properties";

export default async function deleteAllGeocodedProperties() {
    await deleteAllProperties();
}
