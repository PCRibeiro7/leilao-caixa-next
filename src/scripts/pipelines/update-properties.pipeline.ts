import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";

export default async function updatePropertiesPipeline() {
    await fetchRawCsv();
    await parseCsvToProperties();
    await geocodeProperties();
}
