// src/page.tsx

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useBreakpoints from "@/hooks/useBreakPoints";
import { GeocodePrecision, PropertyType } from "@/types/Property";
import { FilterOptions, PropertyFilters } from "@/types/PropertyFilters";
import ToArray from "@/utils/enumToArray";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
    Drawer,
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
    filterOptions: FilterOptions;
    onFiltersChange: (filters: PropertyFilters) => void;
    propertyCount: number;
    loading?: boolean;
    buttonClassName?: string;
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

const COMMERCIAL_PROPERTY_TYPES = [
    PropertyType.Store,
    PropertyType.Warehouse,
    PropertyType.Building,
    PropertyType.Office,
    PropertyType.Comercial,
];

export default function Filter(props: FilterProps) {
    const { filterOptions, onFiltersChange, propertyCount, loading, buttonClassName } = props;

    const { isMd } = useBreakpoints();

    const initialFilters: Filters = useMemo(
        () => ({
            maxPrice: filterOptions.maxPrice,
            minDiscount: filterOptions.minDiscount,
            minPrice: filterOptions.minPrice,
            createdAtDate: filterOptions.createdAtDates,
            sellingType: filterOptions.sellingTypes,
            type: ToArray(PropertyType) as string[],
            state: filterOptions.states,
            city: filterOptions.cities.map((c) => c.city),
            neighborhood: filterOptions.neighborhoods.map((n) => n.neighborhood),
            geocodePrecision: (ToArray(GeocodePrecision) as GeocodePrecision[]),
        }),
        [filterOptions],
    );

    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);

    const propertyTypeGroups = useMemo(() => {
        const commercialPropertyTypes = new Set<string>(COMMERCIAL_PROPERTY_TYPES);

        return [
            {
                label: "Residencial",
                types: initialFilters.type.filter((type) => !commercialPropertyTypes.has(type)),
            },
            {
                label: "Comercial",
                types: initialFilters.type.filter((type) => commercialPropertyTypes.has(type)),
            },
        ];
    }, [initialFilters.type]);

    useEffect(() => {
        setFilters(initialFilters);
        if (!hasInitialized) {
            onFiltersChange({
                minPrice: initialFilters.minPrice,
                maxPrice: initialFilters.maxPrice,
                minDiscount: initialFilters.minDiscount,
                sellingType: [],
                type: [],
                state: [],
                city: [],
                neighborhood: [],
                geocodePrecision: [],
                createdAtDate: [],
            });
            setHasInitialized(true);
        }
    }, [initialFilters, hasInitialized, onFiltersChange]);

    const availableCities = useMemo(
        () =>
            [
                ...new Set(
                    filterOptions.cities
                        .filter((c) => filters.state.includes(c.state))
                        .map((c) => c.city),
                ),
            ].sort((a, b) => a.localeCompare(b)),
        [filterOptions.cities, filters.state],
    );

    const availableNeighborhoods = useMemo(
        () =>
            [
                ...new Set(
                    filterOptions.neighborhoods
                        .filter((n) => filters.state.includes(n.state) && filters.city.includes(n.city))
                        .map((n) => n.neighborhood),
                ),
            ].sort((a, b) => a.localeCompare(b)),
        [filterOptions.neighborhoods, filters.state, filters.city],
    );

    // Cascade: prune cities/neighborhoods when their parent is deselected
    useEffect(() => {
        const availableCitySet = new Set(availableCities);
        const prunedCities = filters.city.filter((c) => availableCitySet.has(c));
        if (prunedCities.length !== filters.city.length) {
            setFilters((prev) => ({ ...prev, city: prunedCities }));
        }
    }, [availableCities, filters.city]);

    useEffect(() => {
        const availableNeighborhoodSet = new Set(availableNeighborhoods);
        const prunedNeighborhoods = filters.neighborhood.filter((n) => availableNeighborhoodSet.has(n));
        if (prunedNeighborhoods.length !== filters.neighborhood.length) {
            setFilters((prev) => ({ ...prev, neighborhood: prunedNeighborhoods }));
        }
    }, [availableNeighborhoods, filters.neighborhood]);

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

    function handlePropertyTypeGroupToggle(types: string[]) {
        const typeSet = new Set(types);
        const hasGroupFilterEnabled = filters.type.some((type) => typeSet.has(type));
        const newFilter = hasGroupFilterEnabled
            ? filters.type.filter((type) => !typeSet.has(type))
            : [...filters.type, ...types.filter((type) => !filters.type.includes(type))];

        setFilters((oldFilter) => ({ ...oldFilter, type: newFilter }));
    }

    function buildApiFilters(f: Filters): PropertyFilters {
        const selectedNeighborhoods = new Set(f.neighborhood);
        const allAvailableSelected = availableNeighborhoods.every((n) => selectedNeighborhoods.has(n));

        return {
            minPrice: f.minPrice,
            maxPrice: f.maxPrice,
            minDiscount: f.minDiscount,
            sellingType: f.sellingType.length === initialFilters.sellingType.length ? [] : f.sellingType,
            type: f.type.length === initialFilters.type.length ? [] : f.type,
            state: f.state.length === initialFilters.state.length ? [] : f.state,
            city: f.city.length === availableCities.length ? [] : f.city,
            neighborhood: allAvailableSelected ? [] : f.neighborhood,
            geocodePrecision: f.geocodePrecision.length === initialFilters.geocodePrecision.length ? [] : f.geocodePrecision.map(String),
            createdAtDate: f.createdAtDate.length === initialFilters.createdAtDate.length ? [] : f.createdAtDate,
        };
    }

    function handleApplyFilters() {
        onFiltersChange(buildApiFilters(filters));
        setIsFilterDrawerOpen(false);
    }

    function handleResetFilters() {
        resetFilters();
        onFiltersChange(buildApiFilters(initialFilters));
        setIsFilterDrawerOpen(false);
    }

    return (
        <Drawer direction={isMd ? "right" : "bottom"} open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
            <DrawerTrigger asChild>
                <Button variant={"default"} className={buttonClassName}>
                    Filtrar Imóveis
                </Button>
            </DrawerTrigger>
            <DrawerContent
                className={
                    isMd
                        ? "h-screen top-0 right-0 left-auto mt-0 w-[460px] rounded-none border-l border-zinc-200 dark:border-zinc-800"
                        : ""
                }
            >
                <DrawerHeader className="pb-2">
                    <DrawerTitle className="text-xl font-bold">Filtrar imóveis</DrawerTitle>
                    <DrawerDescription className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {loading ? "..." : propertyCount.toLocaleString("pt-BR")}
                        </span>
                        <span>imóveis encontrados</span>
                    </DrawerDescription>
                </DrawerHeader>
                <div className="space-y-4 px-4 pb-4 overflow-y-auto flex-1">
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Preço e desconto
                        </p>
                        <div className="grid grid-cols-2 gap-3">
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
                        </div>
                        <div>
                            <Label>Desconto Mínimo:</Label>
                            <Input
                                type="number"
                                value={filters.minDiscount.toString()}
                                onChange={(event) => handleInputFilterChange("minDiscount", event)}
                                startAdornment="%"
                            />
                        </div>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Localização
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <DropdownMenuCheckboxes
                                availableOptions={initialFilters.state.map((state) => ({
                                    label: state,
                                    checked: filters.state.includes(state),
                                }))}
                                onCheckedChange={(label, checked) =>
                                    handleCheckboxFilterChange("state", label, checked)
                                }
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
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-3">
                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Categoria e precisão
                        </p>
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
                                groups={propertyTypeGroups.map((group) => ({
                                    label: group.label,
                                    options: group.types.map((type) => ({
                                        label: type,
                                        checked: filters.type.includes(type),
                                    })),
                                    toggleAll: () => handlePropertyTypeGroupToggle(group.types),
                                }))}
                                onCheckedChange={(label, checked) => handleCheckboxFilterChange("type", label, checked)}
                                toggleAll={() => handleCheckboxFilterToggle("type")}
                                title="Tipo de Imóvel"
                            />
                            <DropdownMenuCheckboxes
                                availableOptions={(ToArray(GeocodePrecision) as GeocodePrecision[]).map(
                                    (precision) => ({
                                        label: precision,
                                        display: mapGeocodePrecisionToDisplay[precision],
                                        checked: filters.geocodePrecision.includes(precision),
                                        icon: {
                                            style: { background: mapGeocodePrecisionToColor[precision] },
                                            className: `rounded-full w-[18px] h-[18px] float-left mr-2 `,
                                        },
                                    }),
                                )}
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
                </div>
                <DrawerFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                    <div className="flex gap-3 w-full">
                        <Button variant={"outline"} className="flex-1 h-10" onClick={handleResetFilters}>
                            Limpar filtros
                        </Button>
                        <Button className="flex-1 h-10" onClick={handleApplyFilters} disabled={loading}>
                            {loading ? "Carregando..." : "Aplicar Filtros"}
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
