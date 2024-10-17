// src/components/map/index.tsx

"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";

import { GeocodedProperty } from "@/types/Property";
import { Map as IMap } from "leaflet";
import { useState } from "react";
import useVisible from "./useVisible";

interface MapProps {
    properties: GeocodedProperty[];
}

const defaults = {
    zoom: 15,
};

const Map = (Map: MapProps) => {
    const { properties } = Map;
    const [map, setMap] = useState<IMap | null>(null);
    const visibleProperties = useVisible(map, properties);

    return (
        <MapContainer
            center={[properties[0].latitude, properties[0].longitude]}
            zoom={defaults.zoom}
            style={{ height: "100%", width: "100%" }}
            ref={setMap}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {visibleProperties.map((property) => (
                <Marker key={property.caixaId} position={[property.latitude, property.longitude]} draggable={false}>
                    <Popup>
                        <b>{property.address} </b>
                        <br />
                        {property.city} , {property.state}
                        <br />
                        Price: {property.priceAsCurrency}
                        <br />
                        Discount: {property.discount} %{/* <br>Type: {property.sellingType}  */}
                        <br />
                        <a
                            href={`https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${property.caixaId}`}
                            target="_blank"
                        >
                            Link Caixa
                        </a>
                        <br />
                        <a
                            href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                            target="_blank"
                        >
                            Link Maps
                        </a>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Map;
