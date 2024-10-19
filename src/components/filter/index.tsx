// src/page.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeocodedProperty } from "@/types/Property";
import { useCallback, useEffect, useState } from "react";
import { Checked, DropdownMenuCheckboxes } from "../ui/dropdown-menu-checkboxes";

type Filters = {
    minPrice: number;
    maxPrice: number;
    minDiscount: number;
    state: string[];
    sellingType: string[];
};

type FilterProps = {
    allProperties: GeocodedProperty[];
    properties: GeocodedProperty[];
    setProperties: (properties: GeocodedProperty[]) => void;
};

export default function MapFilter(props: FilterProps) {
    const { allProperties, properties, setProperties } = props;

    const availableSellingTypes = Array.from(new Set(allProperties.map((property) => property.sellingType))).filter(
        (i) => i
    );
    const availableStates = Array.from(new Set(allProperties.map((property) => property.state))).filter(
        (i) => i
    );
    const maxPrice = Math.max(...allProperties.map((property) => property.price).filter(i=>i));

    const [filters, setFilters] = useState<Filters>({
        sellingType: availableSellingTypes,
        maxPrice: maxPrice,
        minDiscount: 0,
        minPrice: 0,
        state: availableStates
    });

    function handleSellingTypeChange(label: string, check: Checked) {
        const currentSellingTypeFilter = filters.sellingType;
        let newSellingTypeFilter: string[];
        if (check) {
            newSellingTypeFilter = [...currentSellingTypeFilter, label];
        } else {
            newSellingTypeFilter = currentSellingTypeFilter.filter((sellingType) => sellingType !== label);
        }
        setFilters((oldFilter) => ({ ...oldFilter, sellingType: newSellingTypeFilter }));
    }

    function handleStateChange(label: string, check: Checked) {
        const currentStateFilter = filters.state;
        let newStateFilter: string[];
        if (check) {
            newStateFilter = [...currentStateFilter, label];
        } else {
            newStateFilter = currentStateFilter.filter((state) => state !== label);
        }
        setFilters((oldFilter) => ({ ...oldFilter, state: newStateFilter }));
    }

    const applyFilter = useCallback(
        (filters: Filters) => {
            const filteredProperties = allProperties.filter((property) => {
                const price = property.price;
                const discount = property.discount || 0;
                const state = property.state;
                const sellingType = property.sellingType;

                const isAboveMinPrice = price >= filters.minPrice;
                const isBelowMaxPrice = price <= filters.maxPrice;
                const isAboveMinDiscount = discount >= filters.minDiscount;
                const isMatchingStateFilter = filters.state.includes(state);
                const isMatchingSellingTypeFilter = filters.sellingType.includes(sellingType);

                return (
                    isAboveMinPrice &&
                    isBelowMaxPrice &&
                    isAboveMinDiscount &&
                    isMatchingStateFilter &&
                    isMatchingSellingTypeFilter
                );
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
            <div className="flex items-center space-x-4 m-4">
                <div>
                    <Label htmlFor="min-price">Preço Min. (R$):</Label>
                    <Input
                        type="number"
                        name="min-price"
                        value={filters.minPrice}
                        onChange={(event) => setFilters((old) => ({ ...old, minPrice: Number(event.target.value) }))}
                    />
                </div>
                <div>
                    <Label htmlFor="max-price">Preço Máx. (R$):</Label>
                    <Input
                        type="number"
                        name="max-price"
                        value={filters.maxPrice}
                        onChange={(event) => setFilters((old) => ({ ...old, maxPrice: Number(event.target.value) }))}
                    />
                </div>
                <div>
                    <Label htmlFor="min-discount">Desconto Min. (%):</Label>
                    <Input
                        type="number"
                        name="min-discount"
                        value={filters.minDiscount}
                        onChange={(event) => setFilters((old) => ({ ...old, minDiscount: Number(event.target.value) }))}
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableSellingTypes.map((sellingType) => ({
                            label: sellingType,
                            checked: filters.sellingType.includes(sellingType),
                        }))}
                        onCheckedChange={handleSellingTypeChange}
                        title="Tipo Venda"
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableStates.map((state) => ({
                            label: state,
                            checked: filters.state.includes(state),
                        }))}
                        onCheckedChange={handleStateChange}
                        title="Estado"
                    />
                </div>
            </div>

            <div className="m-4 content-end">{properties.length} propriedades encontradas</div>
        </div>
    );
}
