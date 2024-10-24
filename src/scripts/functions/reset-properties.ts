import cleanupProperties from "./steps/cleanup-properties";
import deleteAllProperties from "./steps/cleanup-geocoded-properties";
import fetchRawProperties from "./steps/fetch-raw-properties";
import parseProperties from "./steps/parse-properties";
import fetchGeocodeData from "./steps/fetch-geocode-data";
import safetyCheck from "./steps/safety-check";


export default async function resetProperties(shouldSafetyCheck = true) {
    if (shouldSafetyCheck) {
        await safetyCheck();
    }
    cleanupProperties();
    await deleteAllProperties();
    await fetchRawProperties();
    await parseProperties();
    await fetchGeocodeData();
}
