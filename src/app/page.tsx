// src/page.tsx

"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import propertiesGeocoded from "@/data/properties-geocoded.json";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        console.log(newFilters);
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
        console.log(filters);
        console.log(filteredProperties.length);
        setProperties(filteredProperties);
    }, []);

    useEffect(() => {
        applyFilter(filters);
    }, [filters, applyFilter]);

    return (
        <>
            <div className="bg-white-700 mx-auto w-[100%] h-[100%]">
                <form onSubmit={onSubmit} className="flex items-center space-x-8 m-2">
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
                    <Button type="submit">Apply Filter</Button>
                </form>
                <Map properties={properties} />
            </div>
        </>
    );
}
