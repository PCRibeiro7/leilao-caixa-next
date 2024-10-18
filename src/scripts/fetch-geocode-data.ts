import axios from "axios";
import * as fs from "fs";
import "dotenv/config";
import { GeocodedProperty, Property } from "@/types/Property";
import { PROPERTIES_GEOCODED_PATH, PROPERTIES_PATH } from "@/consts/filePaths";
import readJsonlFileAsJsonArray from "@/utils/readJsonFile";

const geocodedProperties = readJsonlFileAsJsonArray<GeocodedProperty>(PROPERTIES_GEOCODED_PATH);
const properties = readJsonlFileAsJsonArray<Property>(PROPERTIES_PATH);

async function parseCSV(): Promise<void> {
    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) => existingProperty.caixaId === property.caixaId
        );
    });

    console.log(`New properties found: ${newProperties.length}`);

    await geocodeProperties(newProperties);

    console.log(`Geocoded Properties Generated Successfully`);
}

function formatAddress(property: Property): string {
    return `${property.address}, ${property.city}, ${property.state}`;
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
                    fs.appendFileSync(PROPERTIES_GEOCODED_PATH, JSON.stringify(geocodedProperty) + "\n");
                }
            }
            promiseArray = [];
        }

        if (index === properties.length - 1) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    fs.appendFileSync(PROPERTIES_GEOCODED_PATH, JSON.stringify(geocodedProperty) + "\n");
                }
            }
        }
    }
}

const formatStreet = (property: Property, retryNumber: number) => {
    switch (retryNumber) {
        case 0:
            return property.address;
        case 1:
            return property.address.split(",")[0];
        case 2:
            let address = property.address.split(",")[0];
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
            ]) {
                address = address.replaceAll(`${prefix.toUpperCase()} `, "");
                address = address.replaceAll(".", "");
            }
            return address;
    }
};

async function fetchNominatinGeocodeData(property: Property, retryNumber = 0): Promise<GeocodedProperty | undefined> {
    if (retryNumber > 2) {
        const street = formatStreet(property, retryNumber - 1);
        fs.appendFileSync(
            "failed-geocoding.txt",
            `address: ${street} // FULL: ${property.address}, ${property.city}, ${property.state}` + "\n"
        );
        console.warn(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
        return;
    }
    const street = formatStreet(property, retryNumber);
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                street: street,
                city: property.city,
                state: property.state,
                country: "br",
                format: "jsonv2",
            },
        });

        if (response.data.length > 0) {
            const location = response.data[0];
            return {
                ...property,
                latitude: parseFloat(location.lat),
                longitude: parseFloat(location.lon),
                geocodedPrecisely: retryNumber === 0 || retryNumber === 1,
            };
        } else {
            return await fetchNominatinGeocodeData(property, retryNumber + 1);
        }
    } catch (error) {
        console.error(`Error geocoding address: ${property.address}`, error);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchGoogleGeocodeData(property: Property): Promise<GeocodedProperty | undefined> {
    const googleApiKey = process.env.GOOGLE_API_KEY; // Replace with your Google Maps API key
    const formattedAddress = formatAddress(property);
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                address: formattedAddress,
                key: googleApiKey,
            },
        });

        if (response.data.status === "OK" && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return {
                ...property,
                latitude: location.lat,
                longitude: location.lng,
                geocodedPrecisely: true,
            };
        } else {
            console.warn(`Geocoding failed for address: ${formattedAddress}`);
        }
    } catch (error) {
        console.error(`Error geocoding address: ${formattedAddress}`, error);
    }
}

parseCSV();
