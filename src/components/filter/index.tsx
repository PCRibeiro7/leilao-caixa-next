// src/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeocodedProperty } from "@/types/Property";
import { FormEvent, useCallback, useEffect, useState } from "react";

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

type FilterProps = {
    allProperties: GeocodedProperty[];
    properties: GeocodedProperty[];
    setProperties: (properties: GeocodedProperty[]) => void;
};

export default function MapFilter(props: FilterProps) {
    const { allProperties, properties, setProperties } = props;

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

    const applyFilter = useCallback(
        (filters: Filters) => {
            const filteredProperties = allProperties.filter((property) => {
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
        },
        [allProperties, setProperties]
    );

    useEffect(() => {
        applyFilter(filters);
    }, [filters, applyFilter]);

    return (
        <div className="flex justify-between">
            <form onSubmit={onSubmit} className="flex items-center space-x-4 m-4">
                <div>
                    <Label htmlFor="min-price">Preço Min. (R$):</Label>
                    <Input type="number" name="min-price" defaultValue={initialFilters.minPrice} />
                </div>
                <div>
                    <Label htmlFor="max-price">Preço Máx. (R$):</Label>
                    <Input type="number" name="max-price" defaultValue={initialFilters.maxPrice} />
                </div>
                <div>
                    <Label htmlFor="min-discount">Desconto Min. (%):</Label>
                    <Input type="number" name="min-discount" defaultValue={initialFilters.minDiscount} />
                </div>
                <div>
                    <Label htmlFor="state-filter">Estado:</Label>
                    <Input type="text" name="state-filter" defaultValue={initialFilters.stateFilter} />
                </div>
                <div>
                    <Button className="mt-5" type="submit">
                        Aplicar Filtro
                    </Button>
                </div>
            </form>
            <div className="m-4 content-end">{properties.length} propriedades encontradas</div>
        </div>
    );
}
