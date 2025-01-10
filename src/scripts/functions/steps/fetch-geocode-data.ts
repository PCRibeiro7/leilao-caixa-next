import { PROPERTIES_PATH } from "@/consts/filePaths";
import { addBoundingBox, fetchBoundingBoxes, FetchBoundingBoxFilter } from "@/services/boundingBoxes";
import { deletePhoto, getImage, uploadPhoto } from "@/services/photos";
import { addProperty, deleteProperties, fetchAllProperties } from "@/services/properties";
import { GeocodedProperty, GeocodePrecision, Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import axios, { AxiosError } from "axios";
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

// state -> city -> bounding box
const mapStateAndCityToBoundingBox = new Map<string, Map<string, Coordinates<number> | undefined>>();

async function fetchGeocodeData(): Promise<void> {
    const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];
    console.log(`Total Properties: ${properties.length}`);

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

    if(newProperties.length === 0) {
        console.log(`No new properties found. Exiting...`);
        return;
    }

    const fetchBoundingBoxesFilter: FetchBoundingBoxFilter = [];

    for (const property of newProperties) {
        if (!mapStateAndCityToBoundingBox.has(property.state)) {
            mapStateAndCityToBoundingBox.set(property.state, new Map<string, Coordinates<number>>());
        }

        if (!mapStateAndCityToBoundingBox.get(property.state)?.has(property.city)) {
            mapStateAndCityToBoundingBox.get(property.state)?.set(property.city, undefined);
            fetchBoundingBoxesFilter.push({ state: property.state, city: property.city });
        }
    }

    console.log(`Fetching Cached Bounding Boxes. Total to Fetch: ${fetchBoundingBoxesFilter.length}`);
    const cachedBoundingBoxes = await fetchBoundingBoxes(fetchBoundingBoxesFilter);

    for (const boundingBox of cachedBoundingBoxes) {
        const cityMap = mapStateAndCityToBoundingBox.get(boundingBox.state);
        cityMap?.set(boundingBox.city, [boundingBox.x1, boundingBox.y1, boundingBox.x2, boundingBox.y2]);
    }
    console.log(`Cached Bounding Boxes Fetched Successfully. Total Cached: ${cachedBoundingBoxes.length}`);

    console.log(`Fetching New Bounded Boxes`);
    for (const [state, cityMap] of mapStateAndCityToBoundingBox) {
        for (const [city, boundingBox] of cityMap) {
            if (!boundingBox) {
                await fetchBoundingBoxFromNominatim(state, city);
            }
        }
    }
    console.log(`New Bounded Boxes Fetched Successfully`);

    await geocodeProperties(newProperties);

    console.log(`Geocoded Properties Generated Successfully`);
}

async function removeProperties(caixaIds: string[]): Promise<void> {
    await Promise.all([deletePhoto(caixaIds), deleteProperties(caixaIds)]);
}

async function uploadProperty(geocodedProperty: GeocodedProperty): Promise<void> {
    await addProperty(geocodedProperty);

    const base64 = await getImage(geocodedProperty.caixaId);
    if (base64) {
        await uploadPhoto(geocodedProperty.caixaId, base64);
    }
}

async function geocodeProperties(properties: Property[], batchSize = 1): Promise<void> {
    let promiseArray: Promise<GeocodedProperty | undefined>[] = [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) {
            console.log(`Geocoding property ${index + 1} of ${properties.length}`);
        }

        promiseArray.push(fetchNominatinGeocodeData(property));

        if (index % batchSize === 0) {
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
                street: `${property.number ? `${property.number} ` : ""}${property.street}`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
            };
        case 1: {
            const street = removeUnnecessaryInfoFromStreet(property.street);
            return {
                street: `${property.number ? `${property.number} ` : ""}${street}`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
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

const randomUserAgent = `Leilao-Caixa-App-${Math.random().toString(36).substring(7)}`;

async function fetchNominatinGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if(attemptCount === 3){
        return await fetchGeocodeMapsGeocodeData(property);
    }
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
                ...(mapStateAndCityToBoundingBox.has(property.state) &&
                mapStateAndCityToBoundingBox.get(property.state)?.get(property.city)?.length
                    ? {
                          viewbox: mapStateAndCityToBoundingBox.get(property.state)?.get(property.city)?.join(","),
                          bounded: 1,
                      }
                    : {}),
                country: "br",
                format: "jsonv2",
            },
            headers: {
                "User-Agent": randomUserAgent,
            },
        });

        // sleep for ~1 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

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
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        throw new Error(`Error geocoding address: ${property.address}`);
    }
}

async function fetchGeocodeMapsGeocodeData(
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
        const response = await axios.get(`https://geocode.maps.co/search`, {
            params: {
                ...address,
                api_key: process.env.GEOCODE_MAPS_API_KEY,
                country: "BR",
            },
            headers: {
                "User-Agent": randomUserAgent,
            },
        });

        // sleep for ~1 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

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
            return await fetchGeocodeMapsGeocodeData(property, attemptCount + 1);
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        // console.log(property, attemptCount);
        throw new Error(`Error geocoding address: ${property.address}`);
    }
}

async function fetchBoundingBoxFromNominatim(state: string, city: string) {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                state: state,
                city: city,
                country: "br",
                format: "jsonv2",
            },
            headers: {
                "User-Agent": randomUserAgent,
            },
        });

        // sleep for ~1 second to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

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
            const cityMap = mapStateAndCityToBoundingBox.get(state) || new Map<string, Coordinates<number>>();
            mapStateAndCityToBoundingBox.set(state, cityMap);
            cityMap.set(city, orderedBoundingBox);
            await addBoundingBox({
                state,
                city,
                x1: orderedBoundingBox[0],
                y1: orderedBoundingBox[1],
                x2: orderedBoundingBox[2],
                y2: orderedBoundingBox[3],
                createdAt: new Date().toISOString(),
            });
        } else {
            throw new Error(`No bounding box found for city: ${city}`);
        }
    } catch (error) {
        console.error(`Error fetching bounding box for city: ${city}`, error);
        throw new Error(`No bounding box found for city: ${city}`);
    }
}

export default fetchGeocodeData;
