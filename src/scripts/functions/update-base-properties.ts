import cleanupProperties from "./steps/cleanup-properties";
import fetchRawProperties from "./steps/fetch-raw-properties";
// import fetchRawProperties from "./steps/fetch-raw-properties-puppeteer";
import parseProperties from "./steps/parse-properties";
import setBaseProperties from "./steps/update-base-properties";

export default async function updateBaseProperties() {
    cleanupProperties();
    await fetchRawProperties();
    await parseProperties();
    await setBaseProperties();
}
