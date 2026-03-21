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
) => Promise<{ lat: number; lng: number } | null>;

interface GeocoderLink {
    provider: GeocodeProvider;
    geocode: GeocoderFn;
    nextOnFail: GeocoderLink | null;
    nextAttemptOnFail: number | null;
}

// Build the fallback chain:
// GoogleMaps (attempt 0) → GoogleMaps (attempt 1) → Radar → Radar → GeocodeMaps → GeocodeMaps → GeocodeMaps → Nominatim (attempt 3) → Nominatim (attempt 4)
// The chain mirrors the original recursive fallback logic exactly.

const nominatimLink4: GeocoderLink = {
    provider: GeocodeProvider.Nominatim,
    geocode: fetchNominatimGeocode,
    nextOnFail: null,
    nextAttemptOnFail: null,
};

const nominatimLink3: GeocoderLink = {
    provider: GeocodeProvider.Nominatim,
    geocode: fetchNominatimGeocode,
    nextOnFail: nominatimLink4,
    nextAttemptOnFail: 4,
};

const geocodeMapsLink3: GeocoderLink = {
    provider: GeocodeProvider.GeocodeMaps,
    geocode: fetchGeocodeMapsGeocode,
    nextOnFail: nominatimLink3,
    nextAttemptOnFail: 3,
};

const radarLink3: GeocoderLink = {
    provider: GeocodeProvider.Radar,
    geocode: fetchRadarGeocode,
    nextOnFail: geocodeMapsLink3,
    nextAttemptOnFail: 3,
};

const radarLink2: GeocoderLink = {
    provider: GeocodeProvider.Radar,
    geocode: fetchRadarGeocode,
    nextOnFail: radarLink3,
    nextAttemptOnFail: 3,
};

const radarLink1: GeocoderLink = {
    provider: GeocodeProvider.Radar,
    geocode: fetchRadarGeocode,
    nextOnFail: radarLink2,
    nextAttemptOnFail: 2,
};

const googleLink1: GeocoderLink = {
    provider: GeocodeProvider.GoogleMaps,
    geocode: fetchGoogleMapsGeocode,
    nextOnFail: radarLink1,
    nextAttemptOnFail: 1,
};

const googleLink0: GeocoderLink = {
    provider: GeocodeProvider.GoogleMaps,
    geocode: fetchGoogleMapsGeocode,
    nextOnFail: googleLink1,
    nextAttemptOnFail: 1,
};

export async function resolveGeocode(
    property: Property,
    boundingBox?: Coordinates,
): Promise<{ lat: number; lng: number; precision: GeocodePrecision; provider: GeocodeProvider } | undefined> {
    let current: GeocoderLink | null = googleLink0;
    let attemptCount = 0;

    while (current) {
        const result = await current.geocode(property, attemptCount, boundingBox);

        if (result) {
            if (boundingBox) {
                if (result.lat < boundingBox.latitude1 || result.lat > boundingBox.latitude2) {
                    console.log(`Latitude ${result.lat} out of bounds for city: ${property.city}`);
                }
                if (result.lng < boundingBox.longitude1 || result.lng > boundingBox.longitude2) {
                    console.log(`Longitude ${result.lng} out of bounds for city: ${property.city}`);
                }
            }

            return {
                lat: result.lat,
                lng: result.lng,
                precision: mapAttemptCountToPrecision[attemptCount],
                provider: current.provider,
            };
        }

        // Move to next in chain
        if (current.nextAttemptOnFail != null) {
            attemptCount = current.nextAttemptOnFail;
        }
        current = current.nextOnFail;
    }

    console.warn(`Geocoding failed for address: ${property.address}, ${property.city}, ${property.state}`);
    return undefined;
}
