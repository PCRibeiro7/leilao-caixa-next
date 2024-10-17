import axios from "axios";
import * as fs from "fs";
import "dotenv/config";
import geocodedProperties from "../data/properties-geocoded.json";
import properties from "../data/properties.json";
import { GeocodedProperty, Property } from "@/types/Property";
import { PROPERTIES_GEOCODED_PATH } from "@/consts/filePaths";

const ENV = process.env.NODE_ENV;

let failedGeocodingCount = 1;

async function parseCSV(): Promise<void> {
    console.log("CSV file successfully processed");
    if (ENV === "development") {
        properties.splice(10); // Limit the number of properties to 10 for testing
    }

    const newProperties = properties.filter((property) => {
        return !geocodedProperties.some(
            (existingProperty: GeocodedProperty) => existingProperty.caixaId === property.caixaId
        );
    });

    console.log(`New properties found: ${newProperties.length}`);

    const newGeocodedProperties = await geocodeProperties(newProperties);

    const geocodedPropertiesContent = JSON.stringify([...geocodedProperties, ...newGeocodedProperties], null, 2);
    fs.writeFileSync(PROPERTIES_GEOCODED_PATH, geocodedPropertiesContent);
    console.log(`Geocoded Properties Generated Successfully`);
}

function formatAddress(property: Property): string {
    return `${property.address}, ${property.city}, ${property.state}`;
}

async function geocodeProperties(properties: Property[]): Promise<GeocodedProperty[]> {
    const geocodedProperties: GeocodedProperty[] = [];
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
                    geocodedProperties.push(geocodedProperty);
                }
            }
            promiseArray = [];
        }

        if (index === properties.length - 1) {
            const currentGeocodedProperties = await Promise.all(promiseArray);
            for (const geocodedProperty of currentGeocodedProperties) {
                if (geocodedProperty) {
                    geocodedProperties.push(geocodedProperty);
                }
            }
        }
    }

    console.log(`Failed Geocoding Count: ${failedGeocodingCount}. Out of ${properties.length} properties.`);
    return geocodedProperties;
}
async function fetchNominatinGeocodeData(property: Property): Promise<GeocodedProperty | undefined> {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                street: property.address.split(',')[0],
                // county: property.neighborhood,
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
            };
        } else {
            console.warn(`Geocoding failed for address: ${property.address}`);
            failedGeocodingCount++;
        }
    } catch (error) {
        console.error(`Error geocoding address: ${property.address}`, error);
    }
}

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
            };
        } else {
            console.warn(`Geocoding failed for address: ${formattedAddress}`);
        }
    } catch (error) {
        console.error(`Error geocoding address: ${formattedAddress}`, error);
    }
}

parseCSV();
