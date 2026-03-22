"use client";

import { SelectedProperty } from "@/app/table/page";
import { GeocodedProperty } from "@/types/Property";
import { DivIcon, Map as IMap, Marker as LeafletMarker, Point } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import "./map.css";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import Legend from "./map-legend";
import PropertyPopup from "./property-popup";

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

const pinSvg = (color: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`;

const selectedMarkerIcon = new DivIcon({
    html: pinSvg("#c0392b"),
    className: "custom-marker custom-marker--selected",
    iconSize: new Point(30, 45),
    iconAnchor: new Point(15, 45),
});

const defaultMarkerIcon = new DivIcon({
    html: pinSvg("#3388ff"),
    className: "custom-marker custom-marker--default",
    iconSize: new Point(24, 36),
    iconAnchor: new Point(12, 36),
});

const createClusterCustomIcon = (cluster: { getChildCount: () => number }): DivIcon => {
    const count = cluster.getChildCount();
    let sizeClass = "custom-cluster-small";
    let size = 36;
    if (count >= 100) {
        sizeClass = "custom-cluster-large";
        size = 52;
    } else if (count >= 20) {
        sizeClass = "custom-cluster-medium";
        size = 44;
    }
    return new DivIcon({
        html: `<span>${count}</span>`,
        className: `custom-cluster ${sizeClass}`,
        iconSize: new Point(size, size),
        iconAnchor: new Point(size / 2, size / 2),
    });
};

const MainMap = (props: MapProps) => {
    const { properties, showLegend, map, setMap, selectedProperty } = props;
    const itemsRef = useRef<Map<string, LeafletMarker>>(new Map());

    useEffect(() => {
        window.scrollTo(0, 0);

        if (selectedProperty?.new) {
            map?.setView([selectedProperty.new.latitude, selectedProperty.new.longitude], 50, {
                animate: true,
                duration: 0.5,
            });
            const selectedMarker = itemsRef.current.get(selectedProperty.new.caixaId);
            if (selectedMarker) {
                selectedMarker.setIcon(selectedMarkerIcon);
            }
        }

        if (selectedProperty?.old) {
            const oldMarker = itemsRef.current.get(selectedProperty.old.caixaId);
            if (oldMarker) {
                oldMarker.setIcon(defaultMarkerIcon);
            }
        }
    }, [map, selectedProperty]);

    if (properties.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-[100%] gap-4 bg-zinc-50 dark:bg-zinc-950 px-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </div>
                <div className="text-center">
                    <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">Nenhum imóvel encontrado</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Tente ajustar os filtros para ver mais resultados</p>
                </div>
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
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterCustomIcon}
                maxClusterRadius={50}
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
            >
                {properties.map((property) => (
                    <Marker
                        key={property.caixaId}
                        position={[property.latitude, property.longitude]}
                        icon={defaultMarkerIcon}
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
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    );
};

export default MainMap;
