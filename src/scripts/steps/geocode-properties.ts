import { PROPERTIES_FILENAME } from "@/consts/filePaths";
import { addBoundingBox, fetchBoundingBoxes, FetchBoundingBoxFilter } from "@/services/boundingBoxes";
import { addProperty, deleteProperties, fetchAllProperties } from "@/services/properties";
import { GeocodedProperty, Property } from "@/types/Property";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";
import { Coordinates } from "@/scripts/providers/geocoder-common";
import { resolveGeocode } from "@/scripts/utils/geocoder-chain";
import axios from "axios";
import "dotenv/config";

const randomUserAgent = `Leilao-Caixa-App-${Math.random().toString(36).substring(7)}`;

// state -> city -> bounding box
const mapStateAndCityToBoundingBox = new Map<string, Map<string, Coordinates | undefined>>();

export default async function geocodeProperties(maxProperties?: number): Promise<{ remaining: number }> {
    const properties = (await readJsonlFileAsJsonArray<Property>(PROPERTIES_FILENAME)) || [];
    console.log(`Total Properties: ${properties.length}`);

    const geocodedProperties = await fetchAllProperties();
    console.log(`Existing Geocoded Properties: ${geocodedProperties.length}`);

    const geocodedPropertiesToRemove = geocodedProperties.filter((geocodedProperty) => {
        return !properties.find((property) => property.caixaId === geocodedProperty.caixaId);
    });
    console.log(`Properties to remove: ${geocodedPropertiesToRemove.length}`);

    if (geocodedPropertiesToRemove.length > 0) {
        console.log(`Removing properties`);
        await deleteProperties(geocodedPropertiesToRemove.map((property) => property.caixaId));
    }

    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) => existingProperty.caixaId === property.caixaId,
        );
    });
    console.log(`New properties found: ${newProperties.length}`);

    if (newProperties.length === 0) {
        console.log(`No new properties found. Exiting...`);
        return { remaining: 0 };
    }

    await loadBoundingBoxes(newProperties);

    const propertiesToProcess = maxProperties != null ? newProperties.slice(0, maxProperties) : newProperties;

    await geocodePropertyBatch(propertiesToProcess);

    const remaining = newProperties.length - propertiesToProcess.length;
    console.log(`Geocoded Properties Generated Successfully. Remaining: ${remaining}`);

    return { remaining };
}

async function loadBoundingBoxes(properties: Property[]): Promise<void> {
    const fetchBoundingBoxesFilter: FetchBoundingBoxFilter = [];

    for (const property of properties) {
        if (!mapStateAndCityToBoundingBox.has(property.state)) {
            mapStateAndCityToBoundingBox.set(property.state, new Map<string, Coordinates>());
        }

        if (!mapStateAndCityToBoundingBox.get(property.state)?.has(property.city)) {
            mapStateAndCityToBoundingBox.get(property.state)?.set(property.city, undefined);
            fetchBoundingBoxesFilter.push({
                state: property.state,
                city: property.city,
            });
        }
    }

    console.log(`Fetching Cached Bounding Boxes. Total to Fetch: ${fetchBoundingBoxesFilter.length}`);
    const cachedBoundingBoxes = await fetchBoundingBoxes(fetchBoundingBoxesFilter);

    for (const boundingBox of cachedBoundingBoxes) {
        const cityMap = mapStateAndCityToBoundingBox.get(boundingBox.state);
        cityMap?.set(boundingBox.city, {
            longitude1: boundingBox.longitude1,
            latitude1: boundingBox.latitude1,
            longitude2: boundingBox.longitude2,
            latitude2: boundingBox.latitude2,
        });
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
}

async function geocodePropertyBatch(properties: Property[], batchSize = 1): Promise<void> {
    let batch: Promise<GeocodedProperty | undefined>[] = [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) {
            console.log(`Geocoding property ${index + 1} of ${properties.length}`);
        }

        batch.push(geocodeSingleProperty(property));

        const isBatchFull = (index + 1) % batchSize === 0;
        const isLast = index === properties.length - 1;
        if (isBatchFull || isLast) {
            const results = await Promise.all(batch);
            for (const geocoded of results) {
                if (geocoded) {
                    await addProperty(geocoded);
                }
            }
            batch = [];
        }
    }
}

async function geocodeSingleProperty(property: Property): Promise<GeocodedProperty | undefined> {
    const boundingBox = mapStateAndCityToBoundingBox.get(property.state)?.get(property.city);
    if (!boundingBox) {
        console.error(`No bounding box found for city: ${property.city}`);
        return undefined;
    }

    const result = await resolveGeocode(property, boundingBox);
    if (!result) return undefined;

    return {
        ...property,
        latitude: result.lat,
        longitude: result.lng,
        geocodePrecision: result.precision,
        geocodeProvider: result.provider,
    };
}

type CoordinatesArray<T> = [T, T, T, T];

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

        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

        response.data.sort((a: { place_rank: number }, b: { place_rank: number }) => a.place_rank - b.place_rank);

        if (response.data.length > 0) {
            const location = response.data[0];
            const boundingBox: CoordinatesArray<string> = location.boundingbox;
            const boundingBoxNumbers = boundingBox.map((value) => parseFloat(value)) as CoordinatesArray<number>;
            const boundingBoxCoordinates: Coordinates = {
                latitude1: boundingBoxNumbers[0],
                longitude1: boundingBoxNumbers[2],
                latitude2: boundingBoxNumbers[1],
                longitude2: boundingBoxNumbers[3],
            };
            const cityMap = mapStateAndCityToBoundingBox.get(state) || new Map<string, Coordinates>();
            mapStateAndCityToBoundingBox.set(state, cityMap);
            cityMap.set(city, boundingBoxCoordinates);
            await addBoundingBox({
                state,
                city,
                latitude1: boundingBoxCoordinates.latitude1,
                longitude1: boundingBoxCoordinates.longitude1,
                latitude2: boundingBoxCoordinates.latitude2,
                longitude2: boundingBoxCoordinates.longitude2,
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
