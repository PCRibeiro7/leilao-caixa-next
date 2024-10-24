import csv from "csv-parser";
import "dotenv/config";
import { Property } from "@/types/Property";
import { PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { appendFileSync, createReadStream } from "fs";

const ENV = process.env.ENV;

function cleanString(input: string): string {
    return input.replace(/[^a-z0-9 ,.?!]/gi, "");
}

async function parseCSV(): Promise<void> {
    const filePath = PROPERTIES_RAW_PATH;
    let linesProcessed = 0;

    const promise = new Promise<void>((resolve, reject) => {
        try {
            const readStream = createReadStream(filePath, { encoding: "latin1" })
                .pipe(
                    csv({
                        separator: ";",
                        headers: [
                            "N° do imóvel",
                            "UF",
                            "Cidade",
                            "Bairro",
                            "Endereço",
                            "Preço",
                            "Valor de avaliação",
                            "Desconto",
                            "Descrição",
                            "Modalidade de venda",
                            "Link de acesso",
                        ],
                        skipLines: 4, // Skip the first 2 lines before reading headers
                    })
                )
                .on("pipe", () => {
                    console.log("CSV file is being processed");
                })
                .on("data", (data) => {
                    const property: Property = {
                        caixaId: data["N° do imóvel"].trim(),
                        state: data["UF"].trim(),
                        city: data["Cidade"].trim(),
                        neighborhood: cleanString(data["Bairro"]).trim(),
                        street: cleanString(data["Endereço"].split(",")[0]).trim(),
                        address: cleanString(data["Endereço"]).trim(),
                        price: parseLocaleNumber(data["Preço"], "pt-BR"),
                        priceAsCurrency: `R$ ${data["Preço"]}`.trim(),
                        evaluationPrice: parseLocaleNumber(data["Valor de avaliação"], "pt-BR"),
                        discount: parseFloat(data["Desconto"]),
                        sellingType: data["Modalidade de venda"]
                            .trim()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, ""),
                    };
                    linesProcessed++;

                    appendFileSync(PROPERTIES_PATH, JSON.stringify(property) + "\n", { encoding: "latin1" });

                    if (ENV === "dev" && linesProcessed >= 100) {
                        readStream.destroy();
                    }
                })
                .on("end", async () => {
                    console.log("CSV file successfully processed");
                    console.log(`Properties Generated Successfully: ${filePath}`);
                    resolve();
                })
                .on("error", (error) => {
                    console.error("Error reading the CSV file:", error);
                });
        } catch (e) {
            reject(e);
        }
    });
    await promise;
}

function parseLocaleNumber(stringNumber: string, locale: string) {
    const thousandSeparator = Intl.NumberFormat(locale)
        .format(11111)
        .replace(/\p{Number}/gu, "");
    const decimalSeparator = Intl.NumberFormat(locale)
        .format(1.1)
        .replace(/\p{Number}/gu, "");

    return parseFloat(
        stringNumber
            .replace(new RegExp("\\" + thousandSeparator, "g"), "")
            .replace(new RegExp("\\" + decimalSeparator), ".")
    );
}

// parseCSV();

export default parseCSV;