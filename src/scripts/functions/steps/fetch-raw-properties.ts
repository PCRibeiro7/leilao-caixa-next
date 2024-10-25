import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import axios from "axios";
import { createWriteStream } from "fs";

async function fetchRawProperties(): Promise<void> {
    const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv";
    const outputPath = PROPERTIES_RAW_PATH;
    const promise = new Promise<void>(async (resolve, reject) => {
        try {
            const response = await axios.get(url, { responseType: "stream" });
            const writeStream = createWriteStream(outputPath, { encoding: "latin1" });

            response.data.pipe(writeStream);

            writeStream.on("finish", () => {
                console.log(`File downloaded successfully: ${outputPath}`);
                resolve();
            });

            writeStream.on("error", (error) => {
                console.error("Error writing file:", error);
                reject(error);
            });
        } catch (error) {
            console.error("Error downloading file:", error);
            reject(error);
        }
    });
    await promise;
}

export default fetchRawProperties;
