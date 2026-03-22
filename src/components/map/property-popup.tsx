"use client";
import { GeocodedProperty } from "@/types/Property";
import Image from "next/image";
import { useState } from "react";
import { Popup } from "react-leaflet";
import { getArea } from "../properties-table/columns";
import "./property-popup.css";

const FALLBACK_IMAGE = "/placeholder-property.svg";
const MAX_RETRIES = 2;

type PropertyPopupProps = {
    property: GeocodedProperty;
};

export default function PropertyPopup({ property }: PropertyPopupProps) {
    const [retryCount, setRetryCount] = useState(0);

    const getImageSrc = (propertyId: string, retry: number) => {
        const imageId = `${propertyId}${21 + retry}`.padStart(15, "0");
        return `https://venda-imoveis.caixa.gov.br/fotos/F${imageId}.jpg`;
    };

    const imageSrc =
        retryCount > MAX_RETRIES
            ? FALLBACK_IMAGE
            : getImageSrc(property.caixaId, retryCount);

    return (
        <Popup className="custom-popup" minWidth={260} maxWidth={260}>
            <div className="popup-card">
                <Image
                    alt="foto-imovel"
                    src={imageSrc}
                    className="popup-card__img"
                    width={260}
                    height={150}
                    unoptimized
                    onError={() => setRetryCount((c) => c + 1)}
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
