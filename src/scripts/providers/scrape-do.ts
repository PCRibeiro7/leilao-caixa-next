import { PROPERTIES_RAW_FILENAME } from "@/consts/filePaths";
import { uploadTmpFile } from "@/services/tmpStorage";
import axios from "axios";
import "dotenv/config";

const CAIXA_CSV_HEADER_LINES = 4;

export async function fetchCsvScrapeDo(states: string[]): Promise<void> {
    const token = process.env.SCRAPE_DO_TOKEN;
    if (!token) {
        throw new Error("SCRAPE_DO_TOKEN environment variable is required");
    }

    for (const state of states) {
        const targetUrl = encodeURIComponent(`https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${state}.csv`);
        const apiUrl = `https://api.scrape.do/?token=${token}&url=${targetUrl}`;

        console.log(`[scrape.do] Fetching CSV for state ${state}...`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        const buffer = Buffer.from(response.data);
        let csvContent = buffer.toString("latin1");

        csvContent = csvContent.split("\n").slice(CAIXA_CSV_HEADER_LINES).join("\n");

        await uploadTmpFile(PROPERTIES_RAW_FILENAME, csvContent);
        console.log(`[scrape.do] CSV for ${state} uploaded to storage (${buffer.length} bytes)`);
    }
}
