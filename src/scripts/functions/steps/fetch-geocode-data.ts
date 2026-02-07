import { PROPERTIES_PATH } from "@/consts/filePaths";
import {
    addBoundingBox,
    fetchBoundingBoxes,
    FetchBoundingBoxFilter,
} from "@/services/boundingBoxes";
import { deletePhoto, getImage, uploadPhoto } from "@/services/photos";
import {
    addProperty,
    deleteProperties,
    fetchAllProperties,
} from "@/services/properties";
import {
    GeocodedProperty,
    GeocodePrecision,
    GeocodeProvider,
    Property,
} from "@/types/Property";
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

type CoordinatesArray<T> = [T, T, T, T];

type Coordinates = {
    latitude1: number;
    longitude1: number;
    latitude2: number;
    longitude2: number;
}

// state -> city -> bounding box
const mapStateAndCityToBoundingBox = new Map<
    string,
    Map<string, Coordinates | undefined>
>();

async function fetchGeocodeData(): Promise<void> {
    const properties =
        readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH) || [];
    console.log(`Total Properties: ${properties.length}`);

    const geocodedProperties = await fetchAllProperties();
    console.log(`Existing Geocoded Properties: ${geocodedProperties.length}`);

    const geocodedPropertiesToRemove = geocodedProperties.filter(
        (geocodedProperty) => {
            return !properties.find(
                (property) => property.caixaId === geocodedProperty.caixaId
            );
        }
    );
    console.log(`Properties to remove: ${geocodedPropertiesToRemove.length}`);

    if (geocodedPropertiesToRemove.length > 0) {
        console.log(`Removing properties`);
        await removeProperties(
            geocodedPropertiesToRemove.map((property) => property.caixaId)
        );
    }

    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) =>
                existingProperty.caixaId === property.caixaId
        );
    });
    console.log(`New properties found: ${newProperties.length}`);

    if (newProperties.length === 0) {
        console.log(`No new properties found. Exiting...`);
        return;
    }

    const fetchBoundingBoxesFilter: FetchBoundingBoxFilter = [];

    for (const property of newProperties) {
        if (!mapStateAndCityToBoundingBox.has(property.state)) {
            mapStateAndCityToBoundingBox.set(
                property.state,
                new Map<string, Coordinates>()
            );
        }

        if (
            !mapStateAndCityToBoundingBox
                .get(property.state)
                ?.has(property.city)
        ) {
            mapStateAndCityToBoundingBox
                .get(property.state)
                ?.set(property.city, undefined);
            fetchBoundingBoxesFilter.push({
                state: property.state,
                city: property.city,
            });
        }
    }

    console.log(
        `Fetching Cached Bounding Boxes. Total to Fetch: ${fetchBoundingBoxesFilter.length}`
    );
    const cachedBoundingBoxes = await fetchBoundingBoxes(
        fetchBoundingBoxesFilter
    );

    for (const boundingBox of cachedBoundingBoxes) {
        const cityMap = mapStateAndCityToBoundingBox.get(boundingBox.state);
        cityMap?.set(boundingBox.city, {
            longitude1: boundingBox.longitude1,
            latitude1: boundingBox.latitude1,
            longitude2: boundingBox.longitude2,
            latitude2: boundingBox.latitude2,
        });
    }
    console.log(
        `Cached Bounding Boxes Fetched Successfully. Total Cached: ${cachedBoundingBoxes.length}`
    );

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

async function uploadProperty(
    geocodedProperty: GeocodedProperty
): Promise<void> {
    await addProperty(geocodedProperty);

    const base64 = await getImage(geocodedProperty.caixaId);
    if (base64) {
        await uploadPhoto(geocodedProperty.caixaId, base64);
    }
}

async function geocodeProperties(
    properties: Property[],
    batchSize = 1
): Promise<void> {
    let batch: Promise<GeocodedProperty | undefined>[] = [];

    for (const [index, property] of properties.entries()) {
        if (index % 100 === 0) {
            console.log(
                `Geocoding property ${index + 1} of ${properties.length}`
            );
        }

        batch.push(fetchGoogleMapsGeocodeData(property));

        const isBatchFull = (index + 1) % batchSize === 0;
        const isLast = index === properties.length - 1;
        if (isBatchFull || isLast) {
            const results = await Promise.all(batch);
            for (const geocoded of results) {
                if (geocoded) {
                    await uploadProperty(geocoded);
                }
            }
            batch = [];
        }
    }
}

// Basic street normalization (kept intentionally conservative to avoid over-stripping)
const removeUnnecessaryInfoFromStreet = (street: string): string => {
    let cleaned = street
        .split("N ")[0]
        .split("ANTIGA ")[0]
        .split("QUADRA ")[0]
        .split("ANT ")[0];
    const prefixes = [
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
    ];
    cleaned = cleaned.replaceAll(".", "");
    for (const prefix of prefixes) {
        const upper = prefix.toUpperCase();
        cleaned = cleaned.replaceAll(` ${upper} `, " ");
        cleaned = cleaned.replaceAll(`,${upper} `, ",");
    }
    return cleaned.trim();
};

const getFullState = (state: string): string => {
    switch (state) {
        case "RJ":
            return "Rio de Janeiro";
        case "SP":
            return "São Paulo";
        default:
            throw new Error(`Unknown state: ${state}`);
    }
};

const formatAddress = (
    property: Property,
    attemptCount: number
): NominatinAddress => {
    switch (attemptCount) {
        case 0:
            return {
                street: `${property.number ? `${property.number} ` : ""}${
                    property.street
                }`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
            };
        case 1: {
            const street = removeUnnecessaryInfoFromStreet(property.street);
            return {
                street: `${
                    property.number ? `${property.number} ` : ""
                }${street}`,
                city: property.city,
                state: property.state,
                county: property.neighborhood,
            };
        }
        case 2:
            return {
                street: removeUnnecessaryInfoFromStreet(property.street),
                city: property.city,
                state: property.state,
            };
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

// Build a complete address string (filters out undefined pieces so we don't send literal 'undefined')
const buildFullAddressString = (address: NominatinAddress): string => {
    return [address.street, address.county, address.city, address.state]
        .filter(Boolean)
        .join(", ");
};

// Small helper to add jitter depending on precision to avoid overlapping markers
const applyJitter = (lat: number, lng: number, precision: GeocodePrecision) => {
    const isLowPrecision = [
        GeocodePrecision.city,
        GeocodePrecision.neighborhood,
    ].includes(precision);
    const divisor = isLowPrecision ? 10 : 1000;
    return {
        latitude: lat + (Math.random() - 0.5) / divisor,
        longitude: lng + (Math.random() - 0.5) / divisor,
    };
};

const buildGeocodedProperty = (
    property: Property,
    lat: number,
    lng: number,
    precision: GeocodePrecision,
    provider: GeocodeProvider
): GeocodedProperty => {
    const jittered = applyJitter(lat, lng, precision);
    return {
        ...property,
        latitude: jittered.latitude,
        longitude: jittered.longitude,
        geocodePrecision: precision,
        geocodeProvider: provider,
    };
};

const randomUserAgent = `Leilao-Caixa-App-${Math.random()
    .toString(36)
    .substring(7)}`;

async function fetchGoogleMapsGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if (attemptCount === 1) {
        // Fallback chain preserved from original recursive design
        return await fetchRadarGeocodeData(property);
    }
    if (attemptCount > 4) {
        appendFileSync(
            "failed-geocoding.txt",
            `FULL: ${property.address}, ${property.city}, ${property.state}` +
                "\n",
            { encoding: "latin1" }
        );
        console.warn(
            `Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`
        );
        return undefined; // Don't throw to allow other properties to proceed
    }

    const address = formatAddress(property, attemptCount);
    try {
        const boundingBox = mapStateAndCityToBoundingBox
            .get(property.state)
            ?.get(property.city);
        if(!boundingBox) {
            throw new Error(`No bounding box found for city: ${property.city}`);
        }

        const bounds = `${boundingBox.latitude1},${boundingBox.longitude1}|${boundingBox.latitude2},${boundingBox.longitude2}`;
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json`,
            {
                params: {
                    address: buildFullAddressString(address),
                    key: process.env.GOOGLE_MAPS_API_KEY,
                    components: `country:BR|administrative_area:${address.state}|locality:${address.city}`,
                    bounds,
                },
                headers: {
                    "User-Agent": randomUserAgent,
                },
            }
        );

        if (response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lng);
            const precision = mapAttemptCountToPrecision[attemptCount];

            if(latitude < boundingBox!.latitude1 || latitude > boundingBox!.latitude2) {
                debugger;
                throw new Error(`Latitude ${latitude} out of bounds for city: ${property.city}`);
            }

            if(longitude < boundingBox!.longitude1 || longitude > boundingBox!.longitude2) {
                debugger;
                throw new Error(`Longitude ${longitude} out of bounds for city: ${property.city}`);
            }

            return buildGeocodedProperty(
                property,
                latitude,
                longitude,
                precision,
                GeocodeProvider.GoogleMaps
            );
        }
        return await fetchGoogleMapsGeocodeData(property, attemptCount + 1);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(
            `Error geocoding address (Google Maps): ${property.address}`,
            { attemptCount }
        );
    }
}

async function fetchNominatinGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if (attemptCount > 4) {
        appendFileSync(
            "failed-geocoding.txt",
            `FULL: ${property.address}, ${property.city}, ${property.state}` +
                "\n",
            { encoding: "latin1" }
        );
        console.warn(
            `Geocoding failed (Nominatim) for address: ${property.address}, ${property.city}, ${property.state}`
        );
        return undefined;
    }
    const address = formatAddress(property, attemptCount);
    try {
        const viewboxCandidate = mapStateAndCityToBoundingBox
            .get(property.state)
            ?.get(property.city);
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search`,
            {
                params: {
                    ...address,
                    ...(viewboxCandidate
                        ? {
                              viewbox: `${viewboxCandidate.longitude1},${viewboxCandidate.latitude1},${viewboxCandidate.longitude2},${viewboxCandidate.latitude2}`,
                              bounded: 1,
                          }
                        : {}),
                    country: "br",
                    format: "jsonv2",
                },
                headers: {
                    "User-Agent": randomUserAgent,
                },
            }
        );

        await new Promise((resolve) =>
            setTimeout(resolve, (Math.random() + 1) * 1000)
        );

        if (response.data.length > 0) {
            const location = response.data[0];
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lon);
            const precision = mapAttemptCountToPrecision[attemptCount];
            return buildGeocodedProperty(
                property,
                latitude,
                longitude,
                precision,
                GeocodeProvider.Nominatim
            );
        }
        return await fetchNominatinGeocodeData(property, attemptCount + 1);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(
            `Error geocoding address (Nominatim): ${property.address}`,
            { attemptCount }
        );
    }
}

async function fetchRadarGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if (attemptCount === 1) {
        return await fetchGeocodeMapsGeocodeData(property);
    }
    if (attemptCount > 4) {
        appendFileSync(
            "failed-geocoding.txt",
            `FULL: ${property.address}, ${property.city}, ${property.state}` +
                "\n",
            { encoding: "latin1" }
        );
        console.warn(
            `Geocoding failed (Radar) for address: ${property.address}, ${property.city}, ${property.state}`
        );
        return undefined;
    }
    try {
        const response = await axios.get(
            `https://api.radar.io/v1/geocode/forward`,
            {
                params: {
                    country: "BR",
                    query: `${property.street}, ${
                        property.city
                    }, ${getFullState(property.state)}`,
                },
                headers: {
                    "User-Agent": randomUserAgent,
                    Authorization: process.env.RADAR_API_KEY,
                },
            }
        );

        await new Promise((resolve) =>
            setTimeout(resolve, (Math.random() + 1) * 1000)
        );

        if (response.data.addresses.length > 0) {
            const location = response.data.addresses[0];
            const latitude = parseFloat(location.latitude);
            const longitude = parseFloat(location.longitude);
            const precision = mapAttemptCountToPrecision[attemptCount];
            return buildGeocodedProperty(
                property,
                latitude,
                longitude,
                precision,
                GeocodeProvider.Radar
            );
        }
        return await fetchRadarGeocodeData(property, attemptCount + 1);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(`Error geocoding address (Radar): ${property.address}`, {
            attemptCount,
        });
    }
}

async function fetchGeocodeMapsGeocodeData(
    property: Property,
    attemptCount: number = 0
): Promise<GeocodedProperty | undefined> {
    if (attemptCount === 3) {
        return await fetchNominatinGeocodeData(property);
    }
    if (attemptCount > 4) {
        appendFileSync(
            "failed-geocoding.txt",
            `FULL: ${property.address}, ${property.city}, ${property.state}` +
                "\n",
            { encoding: "latin1" }
        );
        console.warn(
            `Geocoding failed (GeocodeMaps) for address: ${property.address}, ${property.city}, ${property.state}`
        );
        return undefined;
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

        await new Promise((resolve) =>
            setTimeout(resolve, (Math.random() + 1) * 1000)
        );

        if (response.data.length > 0) {
            const location = response.data[0];
            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lon);
            const precision = mapAttemptCountToPrecision[attemptCount];
            return buildGeocodedProperty(
                property,
                latitude,
                longitude,
                precision,
                GeocodeProvider.GeocodeMaps
            );
        }
        return await fetchGeocodeMapsGeocodeData(property, attemptCount + 1);
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(
            `Error geocoding address (GeocodeMaps): ${property.address}`,
            { attemptCount }
        );
    }
}

async function fetchBoundingBoxFromNominatim(state: string, city: string) {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/search`,
            {
                params: {
                    state: state,
                    city: city,
                    country: "br",
                    format: "jsonv2",
                },
                headers: {
                    "User-Agent": randomUserAgent,
                },
            }
        );

        // sleep for ~1 second to avoid rate limiting
        await new Promise((resolve) =>
            setTimeout(resolve, (Math.random() + 1) * 1000)
        );

        // Sort by place rank to get the most relevant result => lower place rank
        response.data.sort(
            (a: { place_rank: number }, b: { place_rank: number }) =>
                a.place_rank - b.place_rank
        );

        if (response.data.length > 0) {
            const location = response.data[0];
            const boundingBox: CoordinatesArray<string> = location.boundingbox;
            const boundingBoxNumbers = boundingBox.map((value) =>
                parseFloat(value)
            ) as CoordinatesArray<number>;
            const boundingBoxCoordinates: Coordinates = {
                latitude1: boundingBoxNumbers[0],
                longitude1: boundingBoxNumbers[2],
                latitude2: boundingBoxNumbers[1],
                longitude2: boundingBoxNumbers[3],
            };
            const cityMap =
                mapStateAndCityToBoundingBox.get(state) ||
                new Map<string, Coordinates>();
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

export default fetchGeocodeData;
