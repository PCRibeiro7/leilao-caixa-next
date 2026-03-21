import { Property } from "@/types/Property";
import { buildFullAddressString, formatAddress } from "@/scripts/parsers/address";
import axios, { AxiosError } from "axios";
import { Coordinates, randomUserAgent } from "@/scripts/providers/geocoder-common";

export async function fetchGoogleMapsGeocode(
    property: Property,
    attemptCount: number,
    boundingBox?: Coordinates,
): Promise<{ lat: number; lng: number } | null> {
    const address = formatAddress(property, attemptCount);
    if (!boundingBox) {
        console.log(`No bounding box for Google Maps geocoding: ${property.city}`);
        return null;
    }
    try {
        const bounds = `${boundingBox.latitude1},${boundingBox.longitude1}|${boundingBox.latitude2},${boundingBox.longitude2}`;
        const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
            params: {
                address: buildFullAddressString(address),
                key: process.env.GOOGLE_MAPS_API_KEY,
                components: `country:BR|administrative_area:${address.state}|locality:${address.city}`,
                bounds,
            },
            headers: {
                "User-Agent": randomUserAgent,
            },
        });

        if (response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng),
            };
        }
        return null;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(`Error geocoding address (Google Maps): ${property.address}`, { attemptCount });
        return null;
    }
}
