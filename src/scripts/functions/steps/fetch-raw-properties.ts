import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import axios from "axios";
import { appendFileSync } from "fs";
import { Stream } from "stream";

async function fetchRawProperties(): Promise<void> {
    const states = ["RJ", "SP"];
    const promises = [];
    for (const state of states) {
        const url = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${state}.csv`;
        const outputPath = PROPERTIES_RAW_PATH;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                const response = await axios.get<Stream>(url, { responseType: "stream" });

                // Read the stream response
                let csvContent = "";
                response.data.on("data", (chunk: Buffer) => {
                    csvContent += chunk.toString("latin1");
                });

                response.data.on("end", () => {
                    // remove the first 4 lines of the csv file
                    csvContent = csvContent.split("\n").slice(4).join("\n");
                    appendFileSync(outputPath, csvContent, { encoding: "latin1" });
                    resolve();
                });
            } catch (error) {
                console.error("Error downloading file:", error);
                reject(error);
            }
        });
        promises.push(promise);
    }
    for (const promise of promises) {
        await promise;
    }
}

export default fetchRawProperties;
