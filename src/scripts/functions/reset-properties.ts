import cleanupProperties from "./steps/cleanup-properties";
import deleteAllProperties from "./steps/cleanup-geocoded-properties";
import fetchRawPropertiesLocal from "./steps/fetch-raw-properties-local";
import fetchRawPropertiesScrapeDo from "./steps/fetch-raw-properties-scrape-do";
import parseProperties from "./steps/parse-properties";
import fetchGeocodeData from "./steps/fetch-geocode-data";
import safetyCheck from "./steps/safety-check";

export default async function resetProperties(shouldSafetyCheck = true) {
    if (shouldSafetyCheck) {
        await safetyCheck("Are you sure you want to DELETE all properties?", "abort");
    }
    cleanupProperties();
    await deleteAllProperties();
    if (process.env.ENV === "prod") {
        await fetchRawPropertiesScrapeDo();
    } else {
        await fetchRawPropertiesLocal();
    }
    await parseProperties();
    await fetchGeocodeData();
}
