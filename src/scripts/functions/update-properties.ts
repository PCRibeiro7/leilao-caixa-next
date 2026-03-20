import cleanupProperties from "./steps/cleanup-properties";
import fetchRawPropertiesLocal from "./steps/fetch-raw-properties-local";
import fetchRawPropertiesScrapeDo from "./steps/fetch-raw-properties-scrape-do";
import parseProperties from "./steps/parse-properties";
import fetchGeocodeData from "./steps/fetch-geocode-data";

export default async function updateProperties() {
    await cleanupProperties();
    if (process.env.ENV === "prod") {
        await fetchRawPropertiesScrapeDo();
    } else {
        await fetchRawPropertiesLocal();
    }
    await parseProperties();
    await fetchGeocodeData();
}
