import { PROPERTIES_PATH, PROPERTIES_RAW_PATH } from "@/consts/filePaths";
import { Property, PropertyType } from "@/types/Property";
import csv from "csv-parser";
import "dotenv/config";
import { appendFileSync, createReadStream } from "fs";
import moment from "moment";

function cleanString(input: string): string {
    return input.replace(/[^a-z0-9 ,.?!]/gi, "");
}

function getPropertyNumber(fullAddress: string): number | undefined {
    const addressWithoutDotsAndCommas = fullAddress.replace(/\.|,/g, "");

    const numberAsString =
        addressWithoutDotsAndCommas.indexOf(" N ") !== -1 ? addressWithoutDotsAndCommas.split(" N ")[1].split(" ")[0].trim() : undefined;

    let number: number | undefined = undefined;
    if (numberAsString) {
        number = Number(numberAsString);
        if (isNaN(number)) {
            number = undefined;
        }
    }
    return number;
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
        case "Comercial":
            return PropertyType.Comercial;
        case "Outros":
            return PropertyType.Others;
        default:
            return PropertyType.Unknown;
    }
};

async function parseProperties(): Promise<void> {
    const filePath = PROPERTIES_RAW_PATH;

    const promise = new Promise<void>((resolve, reject) => {
        try {
            createReadStream(filePath, { encoding: "latin1" })
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
                    const propertyTotalArea = Number(descriptionArray[1].trim().split(" ")[0]);
                    const propertyBuiltArea = Number(descriptionArray[2].trim().split(" ")[0]);
                    const propertyLandArea = Number(descriptionArray[3].trim().split(" ")[0]);

                    const descriptionEnd = descriptionArray.slice(4).join("");
                    const bedroomsString =
                        descriptionEnd.indexOf("qto") !== -1 ? descriptionEnd.split("qto")[0].trim() : undefined;

                    let bedrooms: number | undefined = undefined;
                    if (bedroomsString) {
                        bedrooms = Number(bedroomsString);
                    }

                    const property: Property = {
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
                    appendFileSync(PROPERTIES_PATH, JSON.stringify(property) + "\n", { encoding: "latin1" });
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

export default parseProperties;
