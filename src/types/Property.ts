export interface Property {
    caixaId: string;
    street: string;
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

export enum GeocodePrecision {
    fullAddress = "fullAddress",
    address = "address",
    street = "street",
    neighborhood = "neighborhood",
    city = "city",
}
export interface GeocodedProperty extends Property {
    latitude: number;
    longitude: number;
    geocodePrecision: GeocodePrecision;
}
