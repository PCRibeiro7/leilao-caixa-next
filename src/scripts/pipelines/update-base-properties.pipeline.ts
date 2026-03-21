import cleanupTmpFiles from "@/scripts/steps/cleanup-tmp-files";
import fetchRawCsv from "@/scripts/steps/fetch-raw-csv";
import parseCsvToProperties from "@/scripts/steps/parse-csv-to-properties";
import upsertBaseProperties from "@/scripts/steps/upsert-base-properties";

export default async function updateBasePropertiesPipeline() {
    await cleanupTmpFiles();
    await fetchRawCsv();
    await parseCsvToProperties();
    await upsertBaseProperties();
}
