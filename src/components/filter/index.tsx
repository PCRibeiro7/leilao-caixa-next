// src/page.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useBreakpoints from "@/hooks/useBreakPoints";
import { GeocodedProperty, GeocodePrecision, PropertyType } from "@/types/Property";
import ToArray from "@/utils/enumToArray";
import { Separator } from "@radix-ui/react-select";
import moment from "moment";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "../ui/drawer";
import { Checked, DropdownMenuCheckboxes } from "../ui/dropdown-menu-checkboxes";
import MoneyInput from "../ui/money-input";

type InputFilters = {
    minDiscount: number;
};

type MoneyInputFilters = {
    minPrice: number;
    maxPrice: number;
};

type CheckboxFilters = {
    sellingType: string[];
    type: string[];
    state: string[];
    city: string[];
    neighborhood: string[];
    geocodePrecision: GeocodePrecision[];
    createdAtDate: string[];
};

type Filters = InputFilters & MoneyInputFilters & CheckboxFilters;

type FilterProps = {
    allProperties: GeocodedProperty[];
    properties: GeocodedProperty[];
    setProperties: (properties: GeocodedProperty[]) => void;
    buttonClassName?: string;
};

const defaultFilters: Filters = {
    minDiscount: 0,
    minPrice: 0,
    maxPrice: 0,
    createdAtDate: [],
    sellingType: [],
    type: [],
    state: [],
    city: [],
    neighborhood: [],
    geocodePrecision: [],
};

export const mapGeocodePrecisionToDisplay: Record<GeocodePrecision, string> = {
    [GeocodePrecision.city]: "Cidade",
    [GeocodePrecision.neighborhood]: "Bairro",
    [GeocodePrecision.street]: "Rua",
    [GeocodePrecision.address]: "Endereço",
};

export const mapGeocodePrecisionToColor: Record<GeocodePrecision, string> = {
    address: "#313695",
    street: "#4575b4",
    neighborhood: "#f46d43",
    city: "#a50026",
};

export default function Filter(props: FilterProps) {
    const { allProperties, properties, setProperties, buttonClassName } = props;

    const { isMd } = useBreakpoints();

    const [initialFilters, setInitialFilters] = useState<Filters>(defaultFilters);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [availableCities, setAvailableCities] = useState<string[]>(initialFilters.city);
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>(initialFilters.neighborhood);

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    function resetFilters() {
        setFilters(initialFilters);
    }

    function handleInputFilterChange(filterName: keyof InputFilters, event: ChangeEvent<HTMLInputElement>) {
        const value = Number(event.target.value);
        setFilters((oldFilter) => ({ ...oldFilter, [filterName]: value }));
    }

    function handleMoneyInputFilterChange(filterName: keyof MoneyInputFilters, value: number) {
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
                state: initialFilters.state,
                createdAtDate: initialFilters.createdAtDate,
                sellingType: initialFilters.sellingType,
                type: initialFilters.type,
                city: availableCities,
                neighborhood: availableNeighborhoods,
                geocodePrecision: initialFilters.geocodePrecision,
            }[filterName];
        }
        setFilters((oldFilter) => ({ ...oldFilter, [filterName]: newFilter }));
    }

    const applyFilter = useCallback(
        (filters: Filters) => {
            const filteredProperties = allProperties.filter((property) => {
                const price = property.price;
                const discount = property.discount || 0;
                const createdAtDate = moment(property.createdAt).format("DD/MM/YYYY");
                const sellingType = property.sellingType;
                const state = property.state;
                const city = property.city;
                const geocodePrecision = property.geocodePrecision;

                const isAboveMinPrice = price >= filters.minPrice;
                const isBelowMaxPrice = price <= filters.maxPrice;
                const isAboveMinDiscount = discount >= filters.minDiscount;

                const isMatchingCreatedAtDateFilter = filters.createdAtDate.includes(createdAtDate);
                const isMatchingSellingTypeFilter = filters.sellingType.includes(sellingType);
                const isMatchingTypeFilter = filters.type.includes(property.type);
                const isMatchingStateFilter = filters.state.includes(state);
                const isMatchingCityFilter = filters.city.includes(city);
                const isMatchingNeighborhoodFilter = filters.neighborhood.includes(property.neighborhood);
                const isMatchingGeocodePrecisionFilter = filters.geocodePrecision.includes(geocodePrecision);

                return (
                    isAboveMinPrice &&
                    isBelowMaxPrice &&
                    isAboveMinDiscount &&
                    isMatchingCreatedAtDateFilter &&
                    isMatchingSellingTypeFilter &&
                    isMatchingTypeFilter &&
                    isMatchingStateFilter &&
                    isMatchingCityFilter &&
                    isMatchingNeighborhoodFilter &&
                    isMatchingGeocodePrecisionFilter
                );
            });

            setProperties(filteredProperties);
        },
        [allProperties, setProperties]
    );

    useEffect(() => {
        const newAvailableNeighborhoods = Array.from(
            new Set(
                allProperties
                    .filter(
                        (property) => filters.state.includes(property.state) && filters.city.includes(property.city)
                    )
                    .map((property) => property.neighborhood)
            )
        )
            .filter((i) => i)
            .sort((a, b) => a.localeCompare(b));
        setAvailableNeighborhoods(newAvailableNeighborhoods);
    }, [filters.state, filters.city, allProperties]);

    useEffect(() => {
        const newAvailableCities = Array.from(
            new Set(
                allProperties
                    .filter((property) => filters.state.includes(property.state))
                    .map((property) => property.city)
            )
        )
            .filter((i) => i)
            .sort((a, b) => a.localeCompare(b));
        setAvailableCities(newAvailableCities);
    }, [filters.state, allProperties]);

    useEffect(() => {
        const maxPrice = Math.max(...allProperties.map((property) => property.price).filter((i) => i));
        const minPrice = Math.min(...allProperties.map((property) => property.price).filter((i) => i));
        const minDiscount = Math.min(
            ...allProperties.map((property) => property.discount || 0).filter((i) => i !== undefined)
        );

        const availableCreatedAtDates = Array.from(
            new Set(allProperties.map((property) => moment(property.createdAt).format("DD/MM/YYYY")))
        )
            .filter((i) => i)
            .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        const availableSellingTypes = Array.from(new Set(allProperties.map((property) => property.sellingType))).filter(
            (i) => i
        );
        const availableStates = Array.from(new Set(allProperties.map((property) => property.state)))
            .filter((i) => i)
            .sort((a, b) => a.localeCompare(b));
        const availableCities = Array.from(new Set(allProperties.map((property) => property.city)))
            .filter((i) => i)
            .sort((a, b) => a.localeCompare(b));
        const availableNeighborhoods = Array.from(new Set(allProperties.map((property) => property.neighborhood)))
            .filter((i) => i)
            .sort((a, b) => a.localeCompare(b));

        const initialFilters: Filters = {
            maxPrice: maxPrice,
            minDiscount: minDiscount,
            minPrice: minPrice,
            createdAtDate: availableCreatedAtDates,
            sellingType: availableSellingTypes,
            type: ToArray(PropertyType),
            state: availableStates,
            city: availableCities,
            neighborhood: availableNeighborhoods,
            geocodePrecision: ToArray(GeocodePrecision).filter((i) => i !== GeocodePrecision.city),
        };
        setInitialFilters(initialFilters);
        setFilters(initialFilters);
        applyFilter(initialFilters);
    }, [allProperties, applyFilter]);

    useEffect(() => {
        applyFilter(filters);
    }, [filters, applyFilter]);

    return (
        <Drawer direction={isMd ? "right" : "bottom"} open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
            <DrawerTrigger asChild>
                <Button variant={"default"} className={buttonClassName}>
                    Filtrar Imóveis
                </Button>
            </DrawerTrigger>
            <DrawerContent className={isMd ? "h-screen top-0 right-0 left-auto mt-0 w-[500px] rounded-none" : ""}>
                <DrawerHeader>
                    <DrawerTitle> Filtrar imóveis:</DrawerTitle>
                    <DrawerDescription>{properties.length} imóveis encontrados para o filtro atual</DrawerDescription>
                </DrawerHeader>
                <div className="space-y-2 m-4 items-end">
                    <MoneyInput
                        label="Preço Mínimo"
                        value={filters.minPrice}
                        onChange={(value) => handleMoneyInputFilterChange("minPrice", value)}
                    />
                    <MoneyInput
                        label="Preço Máximo"
                        value={filters.maxPrice}
                        onChange={(event) => handleMoneyInputFilterChange("maxPrice", event)}
                    />
                    <div>
                        <Label>Desconto Mínimo:</Label>
                        <Input
                            type="number"
                            value={filters.minDiscount.toString()}
                            onChange={(event) => handleInputFilterChange("minDiscount", event)}
                            startAdornment="%"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <DropdownMenuCheckboxes
                            availableOptions={initialFilters.state.map((state) => ({
                                label: state,
                                checked: filters.state.includes(state),
                            }))}
                            onCheckedChange={(label, checked) => handleCheckboxFilterChange("state", label, checked)}
                            toggleAll={() => handleCheckboxFilterToggle("state")}
                            title="Estado"
                        />
                        <DropdownMenuCheckboxes
                            availableOptions={availableCities.map((city) => ({
                                label: city,
                                checked: filters.city.includes(city),
                            }))}
                            onCheckedChange={(label, checked) => handleCheckboxFilterChange("city", label, checked)}
                            toggleAll={() => handleCheckboxFilterToggle("city")}
                            title="Cidade"
                        />
                        <DropdownMenuCheckboxes
                            availableOptions={availableNeighborhoods.map((neighborhood) => ({
                                label: neighborhood,
                                checked: filters.neighborhood.includes(neighborhood),
                            }))}
                            onCheckedChange={(label, checked) =>
                                handleCheckboxFilterChange("neighborhood", label, checked)
                            }
                            toggleAll={() => handleCheckboxFilterToggle("neighborhood")}
                            title="Bairro"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <DropdownMenuCheckboxes
                            availableOptions={initialFilters.sellingType.map((sellingType) => ({
                                label: sellingType,
                                checked: filters.sellingType.includes(sellingType),
                            }))}
                            onCheckedChange={(label, checked) =>
                                handleCheckboxFilterChange("sellingType", label, checked)
                            }
                            toggleAll={() => handleCheckboxFilterToggle("sellingType")}
                            title="Tipo de Venda"
                        />
                        <DropdownMenuCheckboxes
                            availableOptions={initialFilters.type.map((type) => ({
                                label: type,
                                checked: filters.type.includes(type),
                            }))}
                            onCheckedChange={(label, checked) => handleCheckboxFilterChange("type", label, checked)}
                            toggleAll={() => handleCheckboxFilterToggle("type")}
                            title="Tipo de Imóvel"
                        />
                        <DropdownMenuCheckboxes
                            availableOptions={(ToArray(GeocodePrecision) as GeocodePrecision[]).map((precision) => ({
                                label: precision,
                                display: mapGeocodePrecisionToDisplay[precision],
                                checked: filters.geocodePrecision.includes(precision),
                                icon: {
                                    style: { background: mapGeocodePrecisionToColor[precision] },
                                    className: `rounded-full w-[18px] h-[18px] float-left mr-2 `,
                                },
                            }))}
                            onCheckedChange={(label, checked) =>
                                handleCheckboxFilterChange("geocodePrecision", label, checked)
                            }
                            toggleAll={() => handleCheckboxFilterToggle("geocodePrecision")}
                            title="Precisão"
                        />
                        <DropdownMenuCheckboxes
                            availableOptions={initialFilters.createdAtDate.map((createdAtDate) => ({
                                label: createdAtDate,
                                checked: filters.createdAtDate.includes(createdAtDate),
                            }))}
                            onCheckedChange={(label, checked) =>
                                handleCheckboxFilterChange("createdAtDate", label, checked)
                            }
                            toggleAll={() => handleCheckboxFilterToggle("createdAtDate")}
                            title="Criado em"
                        />
                    </div>
                </div>
                <DrawerFooter className="flex items-center">
                    <Separator className="w-5/6 self-center " />
                    <Button
                        className="mt-5 h-9 w-full self-center"
                        onClick={() => {
                            setIsFilterDrawerOpen(false);
                        }}
                    >
                        Aplicar Filtros
                    </Button>
                    <Button variant={"outline"} className="h-9 w-full self-center" onClick={resetFilters}>
                        Limpar filtros
                    </Button>
                    <DrawerClose className="w-full" asChild>
                        <Button variant="destructive" className="w-full">
                            Cancelar
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
