// src/page.tsx

"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import propertiesGeocodedData from "@/data/properties-geocoded.json";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GeocodedProperty } from "@/types/Property";

type Filters = {
    minPrice: number;
    maxPrice: number;
    minDiscount: number;
    stateFilter: string;
};

const initialFilters: Filters = {
    minPrice: 0,
    maxPrice: 100000,
    minDiscount: 50,
    stateFilter: "RJ",
};

export default function Page() {
    const Map = useMemo(
        () =>
            dynamic(() => import("@/components/map/"), {
                loading: () => <p>A map is loading</p>,
                ssr: false,
            }),
        []
    );

    const propertiesGeocoded = propertiesGeocodedData as GeocodedProperty[];
    const [properties, setProperties] = useState(propertiesGeocoded.slice(0, 10));

    const [filters, setFilters] = useState<Filters>(initialFilters);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const newFilters = {
            minPrice: Number(formData.get("min-price") || 0),
            maxPrice: Number(formData.get("max-price") || Infinity),
            minDiscount: Number(formData.get("min-discount") || 0),
            stateFilter: String(formData.get("state-filter") || ""),
        };
        setFilters(newFilters);
    }

    const applyFilter = useCallback((filters: Filters) => {
        const filteredProperties = propertiesGeocoded.filter((property) => {
            const price = property.price;
            const discount = property.discount || 0;
            const state = property.state;

            const isAboveMinPrice = price >= filters.minPrice;
            const isBelowMaxPrice = price <= filters.maxPrice;
            const isAboveMinDiscount = discount >= filters.minDiscount;
            const isMatchingStateFilter = filters.stateFilter === "" || state === filters.stateFilter;

            return isAboveMinPrice && isBelowMaxPrice && isAboveMinDiscount && isMatchingStateFilter;
        });

        setProperties(filteredProperties);
    }, [propertiesGeocoded]);

    useEffect(() => {
        applyFilter(filters);
    }, [filters, applyFilter]);

    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%]">
                <div className="flex justify-between">
                    <form onSubmit={onSubmit} className="flex items-center space-x-4 m-4">
                        <div>
                            <Label htmlFor="min-price">Min Price (R$):</Label>
                            <Input type="number" name="min-price" defaultValue={initialFilters.minPrice} />
                        </div>
                        <div>
                            <Label htmlFor="max-price">Max Price (R$):</Label>
                            <Input type="number" name="max-price" defaultValue={initialFilters.maxPrice} />
                        </div>
                        <div>
                            <Label htmlFor="min-discount">Min Discount (%):</Label>
                            <Input type="number" name="min-discount" defaultValue={initialFilters.minDiscount} />
                        </div>
                        <div>
                            <Label htmlFor="state-filter">State:</Label>
                            <Input type="text" name="state-filter" defaultValue={initialFilters.stateFilter} />
                        </div>
                        <div>
                            <Button className="mt-5" type="submit">
                                Apply Filter
                            </Button>
                        </div>
                    </form>
                    <div className="m-4 content-end">{properties.length} properties found</div>
                </div>

                <Map properties={properties} />
            </div>
        </>
    );
}
