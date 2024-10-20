import axios from "axios";
import "dotenv/config";
import { GeocodedProperty, GeocodePrecision, Property } from "@/types/Property";
import { PROPERTIES_GEOCODED_PATH, PROPERTIES_PATH } from "@/consts/filePaths";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import { appendFileSync, writeFileSync } from "fs";

const geocodedProperties = readJsonlFileAsJsonArray<GeocodedProperty>(PROPERTIES_GEOCODED_PATH) || [];
const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];

const mapRetryNumberToGeocodePrecision: Record<number, GeocodePrecision> = {
    0: GeocodePrecision.fullAddress,
    1: GeocodePrecision.address,
    2: GeocodePrecision.street,
    3: GeocodePrecision.neighborhood,
    4: GeocodePrecision.city,
};

type NominatinAddress = {
    street?: string;
    county?: string;
    city: string;
    state: string;
};

async function parseCSV(): Promise<void> {
    // removes geocoded properties that are not in the properties file anymore (old properties)
    const geocodedPropertiesToKeep = geocodedProperties.filter((geocodedProperty) => {
        return properties.find((property) => property.caixaId === geocodedProperty.caixaId);
    });
    console.log(
        `Existing geocodedProperties: ${geocodedProperties.length}. Properties to keep: ${geocodedPropertiesToKeep.length}`
    );

    if (geocodedPropertiesToKeep.length > 0) {
        const propertiesToKeepContent =
            geocodedPropertiesToKeep.map((property) => JSON.stringify(property)).join("\n") + "\n";
        writeFileSync(PROPERTIES_GEOCODED_PATH, propertiesToKeepContent, { encoding: "latin1" });
    }

    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) => existingProperty.caixaId === property.caixaId
        );
    });

    console.log(`New properties found: ${newProperties.length}`);

    await geocodeProperties(newProperties);

    console.log(`Geocoded Properties Generated Successfully`);
}

async function geocodeProperties(properties: Property[]): Promise<void> {
    let promiseArray: Promise<GeocodedProperty | undefined>[] = [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) {
            console.log(`Geocoding property ${index + 1} of ${properties.length}`);
        }

        promiseArray.push(fetchNominatinGeocodeData(property));

        if (index % 5 === 0) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    appendFileSync(PROPERTIES_GEOCODED_PATH, JSON.stringify(geocodedProperty) + "\n", {
                        encoding: "latin1",
                    });
                }
            }
            promiseArray = [];
        }

        if (index === properties.length - 1) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    appendFileSync(PROPERTIES_GEOCODED_PATH, JSON.stringify(geocodedProperty) + "\n", {
                        encoding: "latin1",
                    });
                }
            }
        }
    }
}

const removeUnnecessaryInfoFromStreet = (address: string): string => {
    let street = address.split(",")[0];
    for (const prefix of [
        "R",
        "Rua",
        "Av",
        "Avenida",
        "Pca",
        "Praca",
        "Al",
        "Alameda",
        "Trav",
        "Travessa",
        "Rod",
        "Rodovia",
        "Estr",
        "Estrada",
        "N",
        "Antiga",
        "Apto",
    ]) {
        street = street.replaceAll(`${prefix.toUpperCase()} `, "");
        street = street.replaceAll(".", "");
    }
    return street;
};

const formatAddress = (property: Property, retryNumber: number): NominatinAddress => {
    switch (retryNumber) {
        case 0:
            return {
                street: property.address.split(",")[0],
                city: property.city,
                county: property.neighborhood,
                state: property.state,
            };
        case 1: {
            const street = removeUnnecessaryInfoFromStreet(property.address);
            return {
                street: street,
                county: property.neighborhood,
                city: property.city,
                state: property.state,
            };
        }
        case 2: {
            const street = removeUnnecessaryInfoFromStreet(property.address);
            return {
                street: street,
                city: property.city,
                state: property.state,
            };
        }
        case 3:
            return {
                county: property.neighborhood,
                city: property.city,
                state: property.state,
            };
        case 4:
            return {
                city: property.city,
                state: property.state,
            };
        default:
            throw new Error("Invalid retry number");
    }
};

async function fetchNominatinGeocodeData(property: Property, retryNumber = 0): Promise<GeocodedProperty | undefined> {
    if (retryNumber > 4) {
        const street = formatAddress(property, retryNumber - 1);
        appendFileSync(
            "failed-geocoding.txt",
            `address: ${street} // FULL: ${property.address}, ${property.city}, ${property.state}` + "\n",
            { encoding: "latin1" }
        );
        console.warn(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
        return;
    }
    const address = formatAddress(property, retryNumber);
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                ...address,
                country: "br",
                format: "jsonv2",
            },
        });

        if (response.data.length > 0) {
            const location = response.data[0];
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lon);
            const geocodePrecision = mapRetryNumberToGeocodePrecision[retryNumber];
            return {
                ...property,
                latitude: [GeocodePrecision.city, GeocodePrecision.neighborhood].includes(geocodePrecision)
                    ? latitude + (Math.random() - 0.5) / 10
                    : latitude + (Math.random() - 0.5) / 10000,
                longitude: [GeocodePrecision.city, GeocodePrecision.neighborhood].includes(geocodePrecision)
                    ? longitude + (Math.random() - 0.5) / 10
                    : longitude + (Math.random() - 0.5) / 10000,
                geocodePrecision: geocodePrecision,
            };
        } else {
            return await fetchNominatinGeocodeData(property, retryNumber + 1);
        }
    } catch (error) {
        console.error(`Error geocoding address: ${property.address}`, error);
    }
}

parseCSV();
