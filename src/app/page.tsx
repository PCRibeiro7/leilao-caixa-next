// src/page.tsx

"use client";

import Filter from "@/components/filter";
import MapContainer from "@/components/map/map-container";
import { Button } from "@/components/ui/button";
import useFetchFilterOptions from "@/hooks/useFetchFilterOptions";
import useFetchProperties from "@/hooks/useFetchProperties";
import { PropertyFilters } from "@/types/PropertyFilters";
import { Map } from "leaflet";
import { Building2, Loader2, MapPin, Table2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function Page() {
    const filterOptions = useFetchFilterOptions();
    const [filters, setFilters] = useState<PropertyFilters | null>(null);
    const { properties, loading } = useFetchProperties(filters);
    const [map, setMap] = useState<Map | null>(null);

    const handleFiltersChange = useCallback((newFilters: PropertyFilters) => {
        setFilters(newFilters);
    }, []);

    const hasActiveFilters = filters && filterOptions && (
        filters.minPrice !== filterOptions.minPrice ||
        filters.maxPrice !== filterOptions.maxPrice ||
        filters.minDiscount !== filterOptions.minDiscount ||
        filters.sellingType.length > 0 ||
        filters.type.length > 0 ||
        filters.state.length > 0 ||
        filters.city.length > 0 ||
        filters.neighborhood.length > 0 ||
        filters.geocodePrecision.length > 0 ||
        filters.createdAtDate.length > 0
    );

    if (!filterOptions) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-6 bg-zinc-50 dark:bg-zinc-950">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg">
                        <Building2 className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-zinc-50 dark:border-zinc-950 flex items-center justify-center">
                        <MapPin className="w-3 h-3 text-white" />
                    </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Carregando imóveis...</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Buscando dados da Caixa Econômica Federal
                    </p>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-clip relative">
            <MapContainer properties={properties} showLegend={false} map={map} setMap={setMap} loading={loading} />

            {/* Top bar */}
            <div
                className={
                    "fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2.5 md:px-5 md:py-3 pointer-events-none transition-all duration-500 opacity-100 translate-y-0"
                }
            >
                {/* Left section: Brand + counter */}
                <div className="pointer-events-auto flex items-center gap-2.5 ml-10">
                    <div className="bg-zinc-900 dark:bg-white rounded-lg w-8 h-8 flex items-center justify-center shadow-md">
                        <Building2 className="w-4 h-4 text-white dark:text-zinc-900" />
                    </div>
                    <div className="bg-white/85 dark:bg-zinc-900/85 backdrop-blur-lg rounded-xl shadow-lg px-3.5 py-2 border border-white/40 dark:border-zinc-700/50">
                        <div className="flex items-center gap-2">
                            {loading ? (
                                <Loader2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 animate-spin" />
                            ) : (
                                <span className="text-lg font-bold text-zinc-900 dark:text-white leading-none">
                                    {properties.length.toLocaleString("pt-BR")}
                                </span>
                            )}
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-none">
                                {loading ? "Buscando..." : "imóveis"}
                            </span>
                            {hasActiveFilters && (
                                <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 leading-none">
                                    Filtrado
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right section: Table button */}
                {/* <Button
                    className="pointer-events-auto bg-white/85 dark:bg-zinc-900/85 backdrop-blur-lg shadow-lg border border-white/40 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 rounded-xl h-10 px-4 gap-2 transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    variant="ghost"
                    asChild
                >
                    <Link href="/table">
                        <Table2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver em Tabela</span>
                    </Link>
                </Button> */}
            </div>

            {/* Filter button */}
            <Filter
                filterOptions={filterOptions}
                onFiltersChange={handleFiltersChange}
                propertyCount={properties.length}
                loading={loading}
                buttonClassName="fixed bottom-5 left-1/2 -translate-x-1/2 z-10 md:w-auto px-8 py-3 text-base rounded-full shadow-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:scale-[1.03] active:scale-[0.97]"
            />
        </div>
    );
}
