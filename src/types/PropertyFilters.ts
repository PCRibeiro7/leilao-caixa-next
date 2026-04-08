export type PropertyFilters = {
    minPrice: number;
    maxPrice: number;
    minDiscount: number;
    sellingType: string[];
    type: string[];
    state: string[];
    city: string[];
    neighborhood: string[];
    geocodePrecision: string[];
    createdAtDate: string[];
};

export type FilterOptions = {
    states: string[];
    cities: { city: string; state: string }[];
    neighborhoods: { neighborhood: string; city: string; state: string }[];
    sellingTypes: string[];
    types: string[];
    createdAtDates: string[];
    geocodePrecisions: string[];
    minPrice: number;
    maxPrice: number;
    minDiscount: number;
};
