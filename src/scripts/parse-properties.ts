import csv from "csv-parser";
import * as fs from "fs";
import "dotenv/config";
import { Property } from "@/types/Property";
import { PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";

const ENV = process.env.NODE_ENV;

function cleanString(input: string): string {
    return input.replace(/[^a-z0-9 ,.?!]/gi, "");
}

function parseCSV(filePath: string): void {
    const properties: Property[] = [];

    fs.createReadStream(filePath)
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
            properties.push({
                caixaId: data["N° do imóvel"].trim(),
                state: data["UF"].trim(),
                city: data["Cidade"].trim(),
                neighborhood: cleanString(data["Bairro"]).trim(),
                address: cleanString(data["Endereço"]).trim(),
                price: parseLocaleNumber(data["Preço"], "pt-BR"),
                priceAsCurrency: `R$ ${data["Preço"]}`.trim(),
                evaluationPrice: parseLocaleNumber(data["Valor de avaliação"], "pt-BR"),
                discount: parseFloat(data["Desconto"]),
                sellingType: data["Modalidade de venda"].trim(),
            });
        })
        .on("end", async () => {
            console.log("CSV file successfully processed");
            if (ENV === "development") {
                properties.splice(10); // Limit the number of properties to 10 for testing
            }

            const propertiesContent = JSON.stringify(properties, null, 2);
            fs.writeFileSync(PROPERTIES_PATH, propertiesContent);
            console.log(`Properties Generated Successfully: ${filePath}`);
        })
        .on("error", (error) => {
            console.error("Error reading the CSV file:", error);
        });
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

parseCSV(PROPERTIES_RAW_PATH);
