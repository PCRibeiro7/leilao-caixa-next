import { PropertyType } from "@/types/Property";

export const mapPropertyTypeToEnum = (propertyType: string): PropertyType => {
    switch (propertyType) {
        case "Apartamento":
            return PropertyType.Apartment;
        case "Casa":
            return PropertyType.House;
        case "Terreno":
            return PropertyType.Land;
        case "Loja":
            return PropertyType.Store;
        case "Galpão":
            return PropertyType.Warehouse;
        case "Prédio":
            return PropertyType.Building;
        case "Sala":
            return PropertyType.Office;
        case "Sobrado":
            return PropertyType.TwoStoryHouse;
        case "Comercial":
            return PropertyType.Comercial;
        case "Outros":
            return PropertyType.Others;
        case "Imóvel rural":
            return PropertyType.Rural;
        default:
            return PropertyType.Unknown;
    }
};
