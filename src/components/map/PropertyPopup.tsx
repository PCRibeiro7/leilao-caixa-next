"use client";
import { GeocodedProperty } from "@/types/Property";
import Image from "next/image";
import { Popup } from "react-leaflet";
import { getArea } from "../properties-table/columns";

type PropertyPopupProps = {
    property: GeocodedProperty;
};
export default function PropertyPopup({ property }: PropertyPopupProps) {
    return (
        <Popup>
            <Image
                alt="foto-imovel"
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${property.caixaId}.jpg`}
                layout="responsive"
                width={1}
                height={1}
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
    );
}
