"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";

import { GeocodedProperty, GeocodePrecision } from "@/types/Property";
import { useState } from "react";
import Legend from "./Legend";
import { Map } from "leaflet";

export interface MapProps {
    properties: GeocodedProperty[];
}

export const mapGeocodePrecisionToColor: Record<GeocodePrecision, string> = {
    fullAddress: "#313695",
    address: "#4575b4",
    street: "#fdae61",
    neighborhood: "#f46d43",
    city: "#a50026",
};

const defaults = {
    zoom: 8,
};

const MainMap = (props: MapProps) => {
    const { properties } = props;

    const [map, setMap] = useState<Map | null>(null);

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
            <Legend map={map} />
            {properties.map((property) => (
                <CircleMarker
                    key={property.caixaId}
                    center={[property.latitude, property.longitude]}
                    radius={4}
                    color={mapGeocodePrecisionToColor[property.geocodePrecision]}
                >
                    <Popup>
                        <b>{property.address} </b>
                        <br />
                        {property.neighborhood}, {property.city}, {property.state}
                        <br />
                        {property.priceAsCurrency}
                        <br />
                        Desconto: {property.discount}%
                        <br />
                        {property.type}
                        {property.bedrooms ? <>, {property.bedrooms} quartos</> : null},{" "}
                        {property.totalArea ? property.totalArea : property.builtArea} m²
                        <br />
                        {property.sellingType}
                        <br />
                        <a
                            href={`https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${property.caixaId}`}
                            target="_blank"
                        >
                            Link Caixa
                        </a>
                        <br />
                        <a
                            href={`https://maps.google.com/?q=${
                                property.number ? `${property.street}, ${property.number}` : property.address
                            } - ${property.city}, ${property.state}`}
                            target="_blank"
                        >
                            Link Maps
                        </a>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
};

export default MainMap;
