import { PROPERTIES_PATH } from "@/consts/filePaths";
import { deletePhoto, getImage, uploadPhoto } from "@/services/photos";
import { addProperty, deleteProperties, fetchAllProperties } from "@/services/properties";
import { GeocodedProperty, GeocodePrecision, Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import axios from "axios";
import "dotenv/config";
import { appendFileSync } from "fs";

const mapAttemptCountToPrecision: Record<number, GeocodePrecision> = {
    0: GeocodePrecision.address,
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

type Coordinates<T> = [T, T, T, T];

const mapCityToBoundingBox = new Map<string, Coordinates<number>>();

async function fetchGeocodeData(): Promise<void> {
    const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];

    const geocodedProperties = await fetchAllProperties();
    console.log(`Existing Geocoded Properties: ${geocodedProperties.length}`);

    const geocodedPropertiesToRemove = geocodedProperties.filter((geocodedProperty) => {
        return !properties.find((property) => property.caixaId === geocodedProperty.caixaId);
    });
    console.log(`Properties to remove: ${geocodedPropertiesToRemove.length}`);

    if (geocodedPropertiesToRemove.length > 0) {
        console.log(`Removing properties`);
        await removeProperties(geocodedPropertiesToRemove.map((property) => property.caixaId));
    }

    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) => existingProperty.caixaId === property.caixaId
        );
    });
    console.log(`New properties found: ${newProperties.length}`);

    console.log(`Fetching City Bounded Boxes`);
    const uniqueCities = [...new Set(newProperties.map((property) => property.city))];
    for (const city of uniqueCities) {
        await fetchBoundingBox("RJ", city);
    }
    console.log(`City Bounded Boxes Fetched Successfully`);

    await geocodeProperties(newProperties);

    console.log(`Geocoded Properties Generated Successfully`);
}

async function removeProperties(caixaIds: string[]): Promise<void> {
    await Promise.all([deletePhoto(caixaIds), deleteProperties(caixaIds)]);
}

async function uploadProperty(geocodedProperty: GeocodedProperty): Promise<void> {
    const base64 = await getImage(geocodedProperty.caixaId);
    if (!base64) {
        console.error(`Failed to get image for property: ${geocodedProperty.caixaId}`);
        return;
    }
    await Promise.all([uploadPhoto(geocodedProperty.caixaId, base64), addProperty(geocodedProperty)]);
}

async function geocodeProperties(properties: Property[]): Promise<void> {
    let promiseArray: Promise<GeocodedProperty | undefined>[] = [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) {
            console.log(`Geocoding property ${index + 1} of ${properties.length}`);
        }

        promiseArray.push(fetchNominatinGeocodeData(property));

        if (index % 2 === 0) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    await uploadProperty(geocodedProperty);
                }
            }
            promiseArray = [];
        }

        if (index === properties.length - 1) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    await uploadProperty(geocodedProperty);
                }
            }
        }
    }
}

const removeUnnecessaryInfoFromStreet = (street: string): string => {
    street = street.split("N ")[0].split("ANTIGA ")[0].split("QUADRA ")[0].split("ANT ")[0];
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
        "Apto",
    ]) {
        street = street.replaceAll(".", "");
        street = street.replaceAll(` ${prefix.toUpperCase()} `, "");
        street = street.replaceAll(`,${prefix.toUpperCase()} `, "");
    }
    return street;
};

const formatAddress = (property: Property, attemptCount: number): NominatinAddress => {
    switch (attemptCount) {
        case 0:
            return {
                street: property.street,
                city: property.city,
                state: property.state,
            };
        case 1: {
            const street = removeUnnecessaryInfoFromStreet(property.street);
            return {
                street: `${street}${property.number ? `, ${property.number}` : ""}`,
                city: property.city,
                state: property.state,
            };
        }
        case 2: {
            const street = removeUnnecessaryInfoFromStreet(property.street);
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
            throw new Error("Invalid precision");
    }
};

async function fetchNominatinGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if (attemptCount > 4) {
        appendFileSync(
            "failed-geocoding.txt",
            `FULL: ${property.address}, ${property.city}, ${property.state}` + "\n",
            { encoding: "latin1" }
        );
        console.warn(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
        throw new Error(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
    }
    const address = formatAddress(property, attemptCount);
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                ...address,
                ...(mapCityToBoundingBox.has(property.city)
                    ? {
                          viewbox: mapCityToBoundingBox.get(property.city)?.join(","),
                          bounded: 1,
                      }
                    : {}),
                country: "br",
                format: "jsonv2",
            },
        });

        if (response.data.length > 0) {
            const location = response.data[0];
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lon);
            const precision = mapAttemptCountToPrecision[attemptCount];
            return {
                ...property,
                latitude: [GeocodePrecision.city, GeocodePrecision.neighborhood].includes(precision)
                    ? latitude + (Math.random() - 0.5) / 10
                    : latitude + (Math.random() - 0.5) / 1000,
                longitude: [GeocodePrecision.city, GeocodePrecision.neighborhood].includes(precision)
                    ? longitude + (Math.random() - 0.5) / 10
                    : longitude + (Math.random() - 0.5) / 1000,
                geocodePrecision: precision,
            };
        } else {
            return await fetchNominatinGeocodeData(property, attemptCount + 1);
        }
    } catch (error) {
        console.error(`Error geocoding address: ${property.address}`, error);
    }
}

async function fetchBoundingBox(state: string, city: string): Promise<Coordinates<number>> {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                state: state,
                city: city,
                country: "br",
                format: "jsonv2",
            },
        });

        // Sort by place rank to get the most relevant result => lower place rank
        response.data.sort((a: { place_rank: number }, b: { place_rank: number }) => a.place_rank - b.place_rank);

        if (response.data.length > 0) {
            const location = response.data[0];
            const boundingBox: Coordinates<string> = location.boundingbox;
            const boundingBoxNumbers = boundingBox.map((value) => parseFloat(value)) as Coordinates<number>;
            const orderedBoundingBox: Coordinates<number> = [
                boundingBoxNumbers[2],
                boundingBoxNumbers[0],
                boundingBoxNumbers[3],
                boundingBoxNumbers[1],
            ];
            mapCityToBoundingBox.set(city, orderedBoundingBox);
            return orderedBoundingBox;
        } else {
            throw new Error(`No bounding box found for city: ${city}`);
        }
    } catch (error) {
        console.error(`Error fetching bounding box for city: ${city}`, error);
        throw new Error(`No bounding box found for city: ${city}`);
    }
}

export default fetchGeocodeData;
