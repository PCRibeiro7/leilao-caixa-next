import cleanupProperties from "./steps/cleanup-properties";
import fetchRawPropertiesLocal from "./steps/fetch-raw-properties-local";
import fetchRawPropertiesScrapeDo from "./steps/fetch-raw-properties-scrape-do";
import parseProperties from "./steps/parse-properties";
import setBaseProperties from "./steps/update-base-properties";

export default async function updateBaseProperties() {
    cleanupProperties();
    if (process.env.ENV === "prod") {
        await fetchRawPropertiesScrapeDo();
    } else {
        await fetchRawPropertiesLocal();
    }
    await parseProperties();
    await setBaseProperties();
}
