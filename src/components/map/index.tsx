"use client";

import { SelectedProperty } from "@/app/table/page";
import { mapGeocodePrecisionToColor } from "@/components/pages/MapFilter";
import { GeocodedProperty } from "@/types/Property";
import { Map as IMap, CircleMarker as LeafletCircleMarker } from "leaflet";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { getArea } from "../properties-table/columns";
import Legend from "./Legend";

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

        if(selectedProperty?.old) {
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
                    <Popup>
                        <Image
                            alt="foto-imovel"
                            src={`https://venda-imoveis.caixa.gov.br/fotos/F${property.caixaId}21.jpg`}
                            layout="responsive"
                            width={500}
                            height={300}
                        />
                        <b>{property.address} </b>
                        <br />
                        {property.neighborhood}, {property.city}, {property.state}
                        <br />
                        {property.priceAsCurrency}
                        <br />
                        Desconto: {property.discount}%
                        <br />
                        {property.type}
                        {property.bedrooms ? <>, {property.bedrooms} quartos</> : null}, {getArea(property)}
                        m²
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
