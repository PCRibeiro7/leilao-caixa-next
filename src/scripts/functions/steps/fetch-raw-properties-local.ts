import { PROPERTIES_RAW_FILENAME } from "@/consts/filePaths";
import { uploadTmpFile } from "@/services/tmpStorage";
import axios from "axios";
import { Stream } from "stream";

async function fetchRawPropertiesLocal(): Promise<void> {
    const states = ["RJ"];
    let allCsvContent = "";

    for (const state of states) {
        const url = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${state}.csv`;

        const csvContent = await new Promise<string>(async (resolve, reject) => {
            try {
                console.log(`[local] Fetching CSV for state ${state}...`);
                const response = await axios.get<Stream>(url, { responseType: "stream" });

                let content = "";
                response.data.on("data", (chunk: Buffer) => {
                    content += chunk.toString("latin1");
                });

                response.data.on("end", () => {
                    content = content.split("\n").slice(4).join("\n");
                    resolve(content);
                });
            } catch (error) {
                console.error(`[local] Error fetching CSV for state ${state}:`, error);
                reject(error);
            }
        });
        allCsvContent += csvContent;
    }

    await uploadTmpFile(PROPERTIES_RAW_FILENAME, allCsvContent);
    console.log(`[local] CSV uploaded to storage (${allCsvContent.length} bytes)`);
}

export default fetchRawPropertiesLocal;
