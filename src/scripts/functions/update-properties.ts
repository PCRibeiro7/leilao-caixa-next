import cleanupProperties from "./steps/cleanup-properties";
import fetchRawProperties from "./steps/fetch-raw-properties";
import parseProperties from "./steps/parse-properties";
import fetchGeocodeData from "./steps/fetch-geocode-data";

export default async function updateProperties() {
    cleanupProperties();
    await fetchRawProperties();
    await parseProperties();
    await fetchGeocodeData();
}
