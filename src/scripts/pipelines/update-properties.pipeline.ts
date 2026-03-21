import cleanupTmpFiles from "@/scripts/steps/cleanup-tmp-files";
import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import geocodeProperties from "@/scripts/steps/geocode-properties";

export default async function updatePropertiesPipeline() {
    await cleanupTmpFiles();
    await fetchRawCsv();
    await parseCsvToProperties();
    await geocodeProperties();
}
