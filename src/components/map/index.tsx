"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";

import { GeocodedProperty, GeocodePrecision } from "@/types/Property";

interface MapProps {
    properties: GeocodedProperty[];
}

const mapGeocodePrecisionToColor: Record<GeocodePrecision, string> = {
    fullAddress: "rgb(49,54,149)",
    address: "rgb(69,117,180)",
    street: "rgb(253,174,97)",
    neighborhood: "rgb(244,109,67)",
    city: "rgb(165,0,38)",
};

const defaults = {
    zoom: 8,
};

const Map = (props: MapProps) => {
    const { properties } = props;

    if (properties.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-2xl text-center">Nenhum imóvel encontrado para o filtro selecionado</p>
            </div>
        );
    }

    return (
        <MapContainer
            center={[properties[0].latitude, properties[0].longitude]}
            zoom={defaults.zoom}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            preferCanvas={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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
                        {property.city} , {property.state}
                        <br />
                        Preço: {property.priceAsCurrency}
                        <br />
                        Desconto: {property.discount} %
                        <br />
                        Tipo: {property.sellingType}
                        <br />
                        <a
                            href={`https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${property.caixaId}`}
                            target="_blank"
                        >
                            Link Caixa
                        </a>
                        <br />
                        <a
                            href={
                                [GeocodePrecision.fullAddress, GeocodePrecision.address].includes(
                                    property.geocodePrecision
                                )
                                    ? `https://maps.google.com/?q=${property.latitude},${property.longitude}`
                                    : `https://maps.google.com/?q=${property.address}, ${property.city}, ${property.state}`
                            }
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

export default Map;
