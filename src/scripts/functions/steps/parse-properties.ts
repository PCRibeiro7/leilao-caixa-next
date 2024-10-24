import csv from "csv-parser";
import "dotenv/config";
import { Property, PropertyType } from "@/types/Property";
import { PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { appendFileSync, createReadStream } from "fs";

const ENV = process.env.ENV;

function cleanString(input: string): string {
    return input.replace(/[^a-z0-9 ,.?!]/gi, "");
}

const mapPropertyTypeToEnum = (propertyType: string): PropertyType => {
    switch (propertyType) {
        case "Apartamento":
            return PropertyType.Apartment;
        case "Casa":
            return PropertyType.House;
        case "Terreno":
            return PropertyType.Land;
        case "Loja":
            return PropertyType.Store;
        case "Galpão":
            return PropertyType.Warehouse;
        case "Prédio":
            return PropertyType.Building;
        case "Sala":
            return PropertyType.Office;
        case "Sobrado":
            return PropertyType.TwoStoryHouse;
        default:
            return PropertyType.Unknown;
    }
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
                    const descriptionArray: string[] = data["Descrição"].split(",");
                    const propertyType = descriptionArray[0].trim();
                    const propertyTotalArea = Number(descriptionArray[1].trim().split(' ')[0]);
                    const propertyBuiltArea = Number(descriptionArray[2].trim().split(' ')[0]);
                    const propertyLandArea = Number(descriptionArray[3].trim().split(' ')[0]);

                    const descriptionEnd = descriptionArray.slice(4).join("");
                    const bedroomsString =
                        descriptionEnd.indexOf("qto") !== -1 ? descriptionEnd.split("qto")[0].trim() : undefined;

                    let bedrooms = undefined;
                    if (bedroomsString) {
                        bedrooms = Number(bedroomsString);
                    }

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
                        type: mapPropertyTypeToEnum(propertyType),
                        totalArea: propertyTotalArea,
                        builtArea: propertyBuiltArea,
                        landArea: propertyLandArea,
                        bedrooms: bedrooms,
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
