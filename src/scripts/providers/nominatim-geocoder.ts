import { Property } from "@/types/Property";
import { formatAddress } from "@/scripts/parsers/address";
import axios, { AxiosError } from "axios";
import { Coordinates, randomUserAgent } from "@/scripts/providers/geocoder-common";

export async function fetchNominatimGeocode(
    property: Property,
    attemptCount: number,
    boundingBox?: Coordinates,
): Promise<{ lat: number; lng: number } | null> {
    const address = formatAddress(property, attemptCount);
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: {
                ...address,
                ...(boundingBox
                    ? {
                          viewbox: `${boundingBox.longitude1},${boundingBox.latitude1},${boundingBox.longitude2},${boundingBox.latitude2}`,
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
        console.log(`Error geocoding address (Nominatim): ${property.address}`, { attemptCount });
        return null;
    }
}
