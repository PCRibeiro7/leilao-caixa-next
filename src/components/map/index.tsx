"use client";

import { SelectedProperty } from "@/app/table/page";
import { mapGeocodePrecisionToColor } from "@/components/pages/MapFilter";
import { GeocodedProperty } from "@/types/Property";
import { Map as IMap, CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import Legend from "./Legend";
import PropertyPopup from "./PropertyPopup";

export interface MapProps {
    properties: GeocodedProperty[];
    showLegend: boolean;
    map: IMap | null;
    setMap: (map: IMap) => void;
    selectedProperty?: SelectedProperty;
}

const defaults = {
    zoom: 8,
};

const MainMap = (props: MapProps) => {
    const { properties, showLegend, map, setMap, selectedProperty } = props;
    const itemsRef = useRef<Map<string, LeafletCircleMarker>>(new Map());

    useEffect(() => {
        if (selectedProperty?.new) {
            const selectedMarker = itemsRef.current.get(selectedProperty.new.caixaId);
            if (selectedMarker) {
                selectedMarker.setStyle({ radius: 10, weight: 5, color: "black" });
            }
        }

        if (selectedProperty?.old) {
            const oldMarker = itemsRef.current.get(selectedProperty.old.caixaId);
            if (oldMarker) {
                oldMarker.setStyle({ radius: 4, weight: 0 });
            }
        }
    }, [selectedProperty]);

    if (properties.length === 0) {
        return (
            <div className="flex justify-center items-center h-[100%]">
                <p className="text-2xl text-center">Nenhum imóvel encontrado para o filtro selecionado</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={[properties[0].latitude, properties[0].longitude]}
            zoom={defaults.zoom}
            className="h-[100%] w-[100%] z-[1]"
            preferCanvas={true}
            ref={setMap}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showLegend && <Legend map={map} />}
            {properties.map((property) => (
                <CircleMarker
                    key={property.caixaId}
                    center={[property.latitude, property.longitude]}
                    radius={4}
                    weight={0}
                    fillColor={mapGeocodePrecisionToColor[property.geocodePrecision]}
                    fillOpacity={1}
                    ref={(node) => {
                        const refsMap = itemsRef.current;
                        if (node) {
                            refsMap.set(property.caixaId, node);
                        }
                        return () => {
                            refsMap.delete(property.caixaId);
                        };
                    }}
                >
                    <PropertyPopup property={property} />
                </CircleMarker>
            ))}
        </MapContainer>
    );
};

export default MainMap;
