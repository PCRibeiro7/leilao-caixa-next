// src/page.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeocodedProperty } from "@/types/Property";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Checked, DropdownMenuCheckboxes } from "../ui/dropdown-menu-checkboxes";
import { Button } from "../ui/button";

type InputFilters = {
    minPrice: number;
    maxPrice: number;
    minDiscount: number;
};

type CheckboxFilters = {
    sellingType: string[];
    state: string[];
    city: string[];
    neighborhood: string[];
};

type Filters = InputFilters & CheckboxFilters;

type FilterProps = {
    allProperties: GeocodedProperty[];
    properties: GeocodedProperty[];
    setProperties: (properties: GeocodedProperty[]) => void;
};

export default function MapFilter(props: FilterProps) {
    const { allProperties, properties, setProperties } = props;

    const maxPrice = Math.max(...allProperties.map((property) => property.price).filter((i) => i));
    const availableSellingTypes = Array.from(new Set(allProperties.map((property) => property.sellingType))).filter(
        (i) => i
    );
    const availableStates = Array.from(new Set(allProperties.map((property) => property.state))).filter((i) => i);
    const availableCities = Array.from(new Set(allProperties.map((property) => property.city))).filter((i) => i);
    const initialAvailableNeighborhoods = Array.from(new Set(allProperties.map((property) => property.neighborhood))).filter((i) => i);

    const initialFilters: Filters = {
        maxPrice: maxPrice,
        minDiscount: 0,
        minPrice: 0,
        sellingType: availableSellingTypes,
        state: availableStates,
        city: availableCities,
        neighborhood: initialAvailableNeighborhoods,
    };

    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>(initialAvailableNeighborhoods);

    function resetFilters() {
        setFilters(initialFilters);
    }

    function handleInputFilterChange(filterName: keyof InputFilters, event: ChangeEvent<HTMLInputElement>) {
        const value = Number(event.target.value);
        setFilters((oldFilter) => ({ ...oldFilter, [filterName]: value }));
    }

    function handleCheckboxFilterChange(filterName: keyof CheckboxFilters, label: string, checked: Checked) {
        const currentFilter = filters[filterName];
        let newFilter: string[];
        if (checked) {
            newFilter = [...currentFilter, label];
        } else {
            newFilter = currentFilter.filter((value) => value !== label);
        }
        setFilters((oldFilter) => ({ ...oldFilter, [filterName]: newFilter }));
    }

    function handleCheckboxFilterToggle(filterName: keyof CheckboxFilters) {
        const hasFilterEnabled = filters[filterName].length > 0;
        let newFilter: string[];
        if (hasFilterEnabled) {
            newFilter = [];
        } else {
            newFilter = {
                state: availableStates,
                sellingType: availableSellingTypes,
                city: availableCities,
                neighborhood: availableNeighborhoods,
            }[filterName];
        }
        setFilters((oldFilter) => ({ ...oldFilter, [filterName]: newFilter }));
    }

    const applyFilter = useCallback(
        (filters: Filters) => {
            const filteredProperties = allProperties.filter((property) => {
                const price = property.price;
                const discount = property.discount || 0;
                const sellingType = property.sellingType;
                const state = property.state;
                const city = property.city;

                const isAboveMinPrice = price >= filters.minPrice;
                const isBelowMaxPrice = price <= filters.maxPrice;
                const isAboveMinDiscount = discount >= filters.minDiscount;

                const isMatchingSellingTypeFilter = filters.sellingType.includes(sellingType);
                const isMatchingStateFilter = filters.state.includes(state);
                const isMatchingCityFilter = filters.city.includes(city);
                const isMatchingNeighborhoodFilter = filters.neighborhood.includes(property.neighborhood);

                return (
                    isAboveMinPrice &&
                    isBelowMaxPrice &&
                    isAboveMinDiscount &&
                    isMatchingSellingTypeFilter &&
                    isMatchingStateFilter &&
                    isMatchingCityFilter &&
                    isMatchingNeighborhoodFilter
                );
            });

            setProperties(filteredProperties);
        },
        [allProperties, setProperties]
    );

    useEffect(() => {
        applyFilter(filters);
    }, [filters, applyFilter]);

    useEffect(() => {
        const newAvailableNeighborhoods = Array.from(
            new Set(
                allProperties
                    .filter((property) => filters.city.includes(property.city))
                    .map((property) => property.neighborhood)
            )
        ).filter((i) => i);
        setAvailableNeighborhoods(newAvailableNeighborhoods);
    }, [filters.city, allProperties]);

    return (
        <div className="flex justify-between">
            <div className="flex items-center space-x-4 m-4">
                <div>
                    <Label htmlFor="min-price">Preço Min. (R$):</Label>
                    <Input
                        type="number"
                        name="min-price"
                        value={filters.minPrice.toString()}
                        onChange={(event) => handleInputFilterChange("minPrice", event)}
                    />
                </div>
                <div>
                    <Label htmlFor="max-price">Preço Máx. (R$):</Label>
                    <Input
                        type="number"
                        name="max-price"
                        value={filters.maxPrice.toString()}
                        onChange={(event) => handleInputFilterChange("maxPrice", event)}
                    />
                </div>
                <div>
                    <Label htmlFor="min-discount">Desconto Min. (%):</Label>
                    <Input
                        type="number"
                        name="min-discount"
                        value={filters.minDiscount.toString()}
                        onChange={(event) => handleInputFilterChange("minDiscount", event)}
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableSellingTypes.map((sellingType) => ({
                            label: sellingType,
                            checked: filters.sellingType.includes(sellingType),
                        }))}
                        onCheckedChange={(label, checked) => handleCheckboxFilterChange("sellingType", label, checked)}
                        toggleAll={() => handleCheckboxFilterToggle("sellingType")}
                        title="Tipo Venda"
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableStates.map((state) => ({
                            label: state,
                            checked: filters.state.includes(state),
                        }))}
                        onCheckedChange={(label, checked) => handleCheckboxFilterChange("state", label, checked)}
                        toggleAll={() => handleCheckboxFilterToggle("state")}
                        title="Estado"
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableCities.map((city) => ({
                            label: city,
                            checked: filters.city.includes(city),
                        }))}
                        onCheckedChange={(label, checked) => handleCheckboxFilterChange("city", label, checked)}
                        toggleAll={() => handleCheckboxFilterToggle("city")}
                        title="Cidade"
                    />
                </div>
                <div className="mt-5">
                    <DropdownMenuCheckboxes
                        availableOptions={availableNeighborhoods.map((neighborhood) => ({
                            label: neighborhood,
                            checked: filters.neighborhood.includes(neighborhood),
                        }))}
                        onCheckedChange={(label, checked) => handleCheckboxFilterChange("neighborhood", label, checked)}
                        toggleAll={() => handleCheckboxFilterToggle("neighborhood")}
                        title="Bairro"
                    />
                </div>
                <div>
                    <Button className="mt-5 h-9" onClick={resetFilters}>
                        Resetar filtros
                    </Button>
                </div>
            </div>

            <div className="m-4 content-end">{properties.length} propriedades encontradas</div>
        </div>
    );
}
