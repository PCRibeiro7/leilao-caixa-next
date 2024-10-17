export interface Property {
    caixaId: string;
    address: string;
    city: string;
    neighborhood: string;
    state: string;
    sellingType: string;
    price: number;
    priceAsCurrency: string;
    evaluationPrice: number;
    discount: number;
}

export interface GeocodedProperty extends Property {
    latitude: number;
    longitude: number;
}
