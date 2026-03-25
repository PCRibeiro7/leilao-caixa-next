import { GeocodePrecision, GeocodeProvider, Property } from "@/types/Property";
import { Coordinates } from "@/scripts/providers/geocoder-common";
import { fetchGoogleMapsGeocode } from "@/scripts/providers/google-maps-geocoder";
import { fetchRadarGeocode } from "@/scripts/providers/radar-geocoder";
import { fetchGeocodeMapsGeocode } from "@/scripts/providers/geocode-maps-geocoder";
import { fetchNominatimGeocode } from "@/scripts/providers/nominatim-geocoder";

export const mapAttemptCountToPrecision: Record<number, GeocodePrecision> = {
    0: GeocodePrecision.address,
    1: GeocodePrecision.address,
    2: GeocodePrecision.street,
    3: GeocodePrecision.neighborhood,
    4: GeocodePrecision.city,
};

type GeocoderFn = (
    property: Property,
    attemptCount: number,
    boundingBox?: Coordinates,
) => Promise<{ lat: number; lng: number } | null | "exhausted">;

interface GeocoderStep {
    provider: GeocodeProvider;
    geocode: GeocoderFn;
    maxAttempts: number;
}

// Providers are tried in order. Each provider gets up to maxAttempts tries
// (with increasing address simplification) before moving to the next.
const GEOCODER_CHAIN: GeocoderStep[] = [
    { provider: GeocodeProvider.GoogleMaps, geocode: fetchGoogleMapsGeocode, maxAttempts: 3 },
    { provider: GeocodeProvider.GeocodeMaps, geocode: fetchGeocodeMapsGeocode, maxAttempts: 3 },
    { provider: GeocodeProvider.Nominatim, geocode: fetchNominatimGeocode, maxAttempts: 3 },
    { provider: GeocodeProvider.Radar, geocode: fetchRadarGeocode, maxAttempts: 3 },
];

const exhaustedProviders = new Set<GeocodeProvider>();

function isWithinBounds(lat: number, lng: number, box: Coordinates): boolean {
    return (
        lat >= box.latitude1 &&
        lat <= box.latitude2 &&
        lng >= box.longitude1 &&
        lng <= box.longitude2
    );
}

export async function resolveGeocode(
    property: Property,
    boundingBox?: Coordinates,
): Promise<{ lat: number; lng: number; precision: GeocodePrecision; provider: GeocodeProvider } | undefined> {
    for (const step of GEOCODER_CHAIN) {
        if (exhaustedProviders.has(step.provider)) continue;

        for (let attempt = 0; attempt < step.maxAttempts; attempt++) {
            const result = await step.geocode(property, attempt, boundingBox);

            if (result === "exhausted") {
                exhaustedProviders.add(step.provider);
                console.log(`Provider ${step.provider} marked as exhausted for the rest of this execution.`);
                break;
            }

            if (!result) continue;

            if (boundingBox && !isWithinBounds(result.lat, result.lng, boundingBox)) {
                console.log(
                    `Result out of bounds for city: ${property.city} (lat: ${result.lat}, lng: ${result.lng}). Trying next attempt/provider.`,
                );
                continue;
            }

            return {
                lat: result.lat,
                lng: result.lng,
                precision: mapAttemptCountToPrecision[attempt],
                provider: step.provider,
            };
        }
    }

    console.warn(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
    return undefined;
}
