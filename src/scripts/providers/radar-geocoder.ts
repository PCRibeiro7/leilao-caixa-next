import { Property } from "@/types/Property";
import { formatAddress, getFullState } from "@/scripts/parsers/address";
import axios, { AxiosError } from "axios";
import { randomUserAgent } from "@/scripts/providers/geocoder-common";

export async function fetchRadarGeocode(
    property: Property,
    attemptCount: number,
): Promise<{ lat: number; lng: number } | null> {
    try {
        const address = formatAddress(property, attemptCount);
        
        const response = await axios.get(`https://api.radar.io/v1/geocode/forward`, {
            params: {
                country: "BR",
                query: `${address.street}, ${address.city}, ${getFullState(address.state)}`,
            },
            headers: {
                "User-Agent": randomUserAgent,
                Authorization: process.env.RADAR_API_KEY,
            },
        });

        await new Promise((resolve) => setTimeout(resolve, (Math.random() + 1) * 1000));

        if (response.data.addresses.length > 0) {
            const location = response.data.addresses[0];
            return {
                lat: parseFloat(location.latitude),
                lng: parseFloat(location.longitude),
            };
        }
        return null;
    } catch (error) {
        if (error instanceof AxiosError) {
            console.error(error.response?.data);
        }
        console.log(`Error geocoding address (Radar): ${property.address}`, { attemptCount });
        return null;
    }
}
