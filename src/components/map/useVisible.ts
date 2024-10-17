import { useCallback, useEffect, useState } from "react";
import { Map as IMap } from "leaflet";
import { GeocodedProperty } from "@/types/Property";

const useVisible = (map: IMap | null, properties: GeocodedProperty[]) => {
    const [visibleProperties, setVisibleProperties] = useState<GeocodedProperty[]>([]);

    const updateVisibleProperties = useCallback(
        (map: IMap) => {
            const bounds = map.getBounds();
            const newMarkers = [];
            for (const property of properties) {
                if (bounds.contains([property.latitude, property.longitude])) {
                    newMarkers.push(property);
                }
            }
            setVisibleProperties(newMarkers);
        },
        [properties]
    );

    useEffect(() => {
        if (!map) return;
        // Updates markers after map initially renders
        updateVisibleProperties(map);

        map.on("dragend", function () {
            // Updates markers after user drags the map to change position
            updateVisibleProperties(map);
        });
        map.on("zoomend", function () {
            // Updates markers after user zooms in/out
            updateVisibleProperties(map);
        });
    }, [map, updateVisibleProperties]);

    return visibleProperties;
};

export default useVisible;
