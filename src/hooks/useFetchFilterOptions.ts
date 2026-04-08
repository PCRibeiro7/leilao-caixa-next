"use client";

import { FilterOptions } from "@/types/PropertyFilters";
import { useEffect, useState } from "react";

export default function useFetchFilterOptions(): FilterOptions | null {
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

    useEffect(() => {
        async function fetchFilterOptions() {
            const response = await fetch("/api/properties/filters");
            const data: FilterOptions = await response.json();
            setFilterOptions(data);
        }
        fetchFilterOptions();
    }, []);

    return filterOptions;
}
