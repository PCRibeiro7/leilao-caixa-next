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
    state: string;
    city: string;
    neighborhood: string;
    address: string;
    street: string;
    number?: number;
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
