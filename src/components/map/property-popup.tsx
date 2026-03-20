"use client";
import { GeocodedProperty } from "@/types/Property";
import Image from "next/image";
import { Popup } from "react-leaflet";
import { getArea } from "../properties-table/columns";
import "./property-popup.css";

type PropertyPopupProps = {
    property: GeocodedProperty;
};

export default function PropertyPopup({ property }: PropertyPopupProps) {
    return (
        <Popup className="custom-popup" minWidth={260} maxWidth={260}>
            <div className="popup-card">
                <Image
                    alt="foto-imovel"
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${property.caixaId}.jpg`}
                    className="popup-card__img"
                    width={260}
                    height={150}
                    unoptimized
                />
                <div className="popup-card__body">
                    <p className="popup-card__address">{property.address}</p>
                    <p className="popup-card__location">
                        {property.neighborhood}, {property.city} &ndash; {property.state}
                    </p>

                    <div className="popup-card__price-row">
                        <span className="popup-card__price">{property.priceAsCurrency}</span>
                        <span className="popup-card__discount">-{property.discount}%</span>
                    </div>

                    <div className="popup-card__details">
                        <span>{property.type}</span>
                        {property.bedrooms ? <span>{property.bedrooms} quartos</span> : null}
                        <span>{getArea(property)} m&sup2;</span>
                    </div>

                    <p className="popup-card__selling">{property.sellingType}</p>

                    <div className="popup-card__links">
                        <a
                            href={`https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${property.caixaId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-card__link popup-card__link--caixa"
                        >
                            Caixa
                        </a>
                        <a
                            href={`https://maps.google.com/?q=${
                                property.number ? `${property.street}, ${property.number}` : property.address
                            } - ${property.city}, ${property.state}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="popup-card__link popup-card__link--maps"
                        >
                            Maps
                        </a>
                    </div>
                </div>
            </div>
        </Popup>
    );
}
