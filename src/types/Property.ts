export enum PropertyType {
    Apartment = "Apartamento",
    House = "Casa",
    Land = "Terreno",
    Store = "Loja",
    Warehouse = "Galpão",
    Others = "Outros",
    Building = "Prédio",
    Office = "Sala",
    TwoStoryHouse = "Sobrado",
    Comercial = "Comercial",
    Unknown = "Desconhecido",
}

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
    type: PropertyType;
    totalArea: number;
    builtArea: number;
    landArea: number;
    bedrooms?: number;
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
