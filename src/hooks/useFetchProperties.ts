"use client";
import { GeocodedProperty } from "@/types/Property";
import { PropertyFilters } from "@/types/PropertyFilters";
import { useEffect, useRef, useState } from "react";

export default function useFetchProperties(filters: PropertyFilters | null): {
    properties: GeocodedProperty[];
    loading: boolean;
} {
    const [properties, setProperties] = useState<GeocodedProperty[]>([]);
    const [loading, setLoading] = useState(false);
    const serializedFilters = filters ? JSON.stringify(filters) : null;
    const controllerRef = useRef<AbortController | null>(null);
    const [prevSerializedFilters, setPrevSerializedFilters] = useState<string | null>(null);

    // Set loading synchronously during render so the UI updates immediately
    if (serializedFilters !== prevSerializedFilters) {
        setPrevSerializedFilters(serializedFilters);
        if (serializedFilters) {
            setLoading(true);
            setProperties([]);
        }
    }

    useEffect(() => {
        if (!serializedFilters) return;

        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        async function fetchProperties() {
            try {
                const response = await fetch("/api/properties", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: serializedFilters,
                    signal: controller.signal,
                });
                const data: GeocodedProperty[] = await response.json();
                setProperties(data);
            } catch (err) {
                if (err instanceof DOMException && err.name === "AbortError") return;
                console.error("Failed to fetch properties:", err);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }
        fetchProperties();

        return () => controller.abort();
    }, [serializedFilters]);

    return { properties, loading };
}
