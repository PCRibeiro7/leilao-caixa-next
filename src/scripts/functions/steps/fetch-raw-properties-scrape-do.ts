import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import "dotenv/config";
import axios from "axios";
import { writeFileSync } from "fs";

const SCRAPE_DO_TOKEN = process.env.SCRAPE_DO_TOKEN;

async function fetchRawPropertiesScrapeDo(): Promise<void> {
    if (!SCRAPE_DO_TOKEN) {
        throw new Error("SCRAPE_DO_TOKEN environment variable is required");
    }

    const states = ["RJ"];

    for (const state of states) {
        const targetUrl = encodeURIComponent(
            `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${state}.csv`,
        );
        const apiUrl = `https://api.scrape.do/?token=${SCRAPE_DO_TOKEN}&url=${targetUrl}`;

        console.log(`[scrape.do] Fetching CSV for state ${state}...`);

        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

        const buffer = Buffer.from(response.data);
        let csvContent = buffer.toString("latin1");

        // Remove the first 4 header lines from Caixa CSV
        csvContent = csvContent.split("\n").slice(4).join("\n");

        writeFileSync(PROPERTIES_RAW_PATH, csvContent, { encoding: "latin1" });
        console.log(`[scrape.do] CSV for ${state} written to ${PROPERTIES_RAW_PATH} (${buffer.length} bytes)`);
    }
}

export default fetchRawPropertiesScrapeDo;
