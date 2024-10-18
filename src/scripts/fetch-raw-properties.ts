import { PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import axios from "axios";
import { createWriteStream } from "fs";

async function downloadFile(url: string, outputPath: string): Promise<void> {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        const writeStream = createWriteStream(outputPath, { encoding: "latin1" });

        response.data.pipe(writeStream);

        writeStream.on("finish", () => {
            console.log(`File downloaded successfully: ${outputPath}`);
        });

        writeStream.on("error", (error) => {
            console.error("Error writing file:", error);
        });
    } catch (error) {
        console.error("Error downloading file:", error);
    }
}

const url = "https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_RJ.csv";

downloadFile(url, PROPERTIES_RAW_PATH);
