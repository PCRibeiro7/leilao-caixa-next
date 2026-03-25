import deleteAllGeocodedProperties from "@/scripts/steps/delete-all-properties";
import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";
import safetyPrompt from "@/scripts/utils/safety-prompt";

export default async function resetPropertiesPipeline(shouldSafetyCheck = true) {
    if (shouldSafetyCheck) {
        await safetyPrompt("Are you sure you want to DELETE all properties?", "abort");
    }
    await deleteAllGeocodedProperties();
    await fetchRawCsv();
    await parseCsvToProperties();
    await geocodeProperties();
}
