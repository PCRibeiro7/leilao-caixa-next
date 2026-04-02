import { PROPERTIES_FILENAME, PROPERTIES_RAW_FILENAME } from "@/consts/filePaths";
import { downloadTmpFile, uploadTmpFile } from "@/services/tmpStorage";
import { Property } from "@/types/Property";
import csv from "csv-parser";
import moment from "moment";
import { Readable } from "stream";
import { cleanString, getPropertyNumber, parseLocaleNumber } from "./address";
import { mapPropertyTypeToEnum } from "./property-type";

const CSV_HEADERS = [
    "N° do imóvel",
    "UF",
    "Cidade",
    "Bairro",
    "Endereço",
    "Preço",
    "Valor de avaliação",
    "Desconto",
    "Financiamento",
    "Descrição",
    "Modalidade de venda",
    "Link de acesso",
];

export function parseCsvRow(data: Record<string, string>): Property {
    const descriptionArray: string[] = data["Descrição"].split(",");
    const propertyType = descriptionArray[0].trim();
    const propertyTotalArea = Number(descriptionArray[1].trim().split(" ")[0]);
    const propertyBuiltArea = Number(descriptionArray[2].trim().split(" ")[0]);
    const propertyLandArea = Number(descriptionArray[3].trim().split(" ")[0]);

    const descriptionEnd = descriptionArray.slice(4).join("");
    const bedroomsString = descriptionEnd.indexOf("qto") !== -1 ? descriptionEnd.split("qto")[0].trim() : undefined;

    let bedrooms: number | undefined = undefined;
    if (bedroomsString) {
        bedrooms = Number(bedroomsString);
    }

    return {
        caixaId: data["N° do imóvel"].trim(),
        state: data["UF"].trim(),
        city: data["Cidade"].trim(),
        neighborhood: cleanString(data["Bairro"]).trim(),
        address: cleanString(data["Endereço"]).trim(),
        street: cleanString(data["Endereço"].split(",")[0]).trim(),
        number: getPropertyNumber(data["Endereço"]),
        price: parseLocaleNumber(data["Preço"], "pt-BR"),
        priceAsCurrency: `R$ ${data["Preço"]}`.trim(),
        evaluationPrice: parseLocaleNumber(data["Valor de avaliação"], "pt-BR"),
        discount: parseFloat(data["Desconto"]),
        sellingType: data["Modalidade de venda"]
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        type: mapPropertyTypeToEnum(propertyType),
        totalArea: propertyTotalArea,
        builtArea: propertyBuiltArea,
        landArea: propertyLandArea,
        bedrooms: bedrooms,
        createdAt: moment().toISOString(),
    };
}

export default async function parseProperties(): Promise<void> {
    const csvContent = await downloadTmpFile(PROPERTIES_RAW_FILENAME);
    if (!csvContent) {
        throw new Error("CSV file not found in storage");
    }

    const properties: string[] = [];

    const promise = new Promise<void>((resolve, reject) => {
        try {
            Readable.from(csvContent)
                .pipe(
                    csv({
                        separator: ";",
                        headers: CSV_HEADERS,
                    }),
                )
                .on("pipe", () => {
                    console.log("CSV file is being processed");
                })
                .on("data", (data) => {
                    const property = parseCsvRow(data);
                    properties.push(JSON.stringify(property));
                })
                .on("end", async () => {
                    console.log("CSV file successfully processed");
                    await uploadTmpFile(PROPERTIES_FILENAME, properties.join("\n") + "\n");
                    console.log(`Properties Generated Successfully: ${properties.length} properties`);
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
