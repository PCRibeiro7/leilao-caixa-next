import { Property } from "@/types/Property";
import { formatAddress } from "@/scripts/parsers/address";
import axios, { AxiosError } from "axios";
import { randomUserAgent } from "@/scripts/providers/geocoder-common";

export async function fetchGeocodeMapsGeocode(
    property: Property,
    attemptCount: number,
): Promise<{ lat: number; lng: number } | null> {
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

        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

        if (response.data.length > 0) {
            const location = response.data[0];
            return {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon),
            };
        }
        return null;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(`Error geocoding address (GeocodeMaps): ${property.address}`, { attemptCount });
        return null;
    }
}
