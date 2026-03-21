import { fetchCsvDirect } from "@/scripts/providers/caixa-direct";
import { fetchCsvScrapeDo } from "@/scripts/providers/scrape-do";

const STATES = ["RJ"];

export default async function fetchRawCsv(): Promise<void> {
    if (process.env.ENV === "prod") {
        await fetchCsvScrapeDo(STATES);
    } else {
        await fetchCsvDirect(STATES);
    }
}
