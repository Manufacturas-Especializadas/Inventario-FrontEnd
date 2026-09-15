import { useCallback, useEffect, useRef, useState } from "react";
import { colorsService } from "../api/services/colorsService";
import type { ProductColor } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface UseColorsOptions {
    autoLoad?: boolean;
}

export function useColors({ autoLoad = true }: UseColorsOptions = {}) {
    const [colors, setColors] = useState<ProductColor[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, ProductColor>());

    const getColors = useCallback(() => {
        if (pendingRequest.current) {
            return pendingRequest.current;
        }

        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();

        const request = (async () => {
            try {
                const data = await colorsService.getAll();
                // Preserve successful mutations that finished while this GET was pending.
                const merged = new Map(data.map((color) => [color.id, color]));
                updatesDuringLoad.current.forEach((color) => {
                    merged.set(color.id, color);
                });
                setColors(Array.from(merged.values()));
                setHasLoaded(true);
            } catch (error) {
                setError(getApiErrorMessage(error, "No se pudieron cargar los colores."));
            } finally {
                setLoading(false);
                pendingRequest.current = null;
                updatesDuringLoad.current.clear();
            }
        })();

        pendingRequest.current = request;
        return request;
    }, []);

    const upsertColor = useCallback((color: ProductColor) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(color.id, color);
        }

        setColors((current) => current.some((entry) => entry.id === color.id)
            ? current.map((entry) => entry.id === color.id ? color : entry)
            : [...current, color]);
    }, []);

    useEffect(() => {
        if (autoLoad) {
            void getColors();
        }
    }, [autoLoad, getColors]);

    const activeColors = colors.filter((color) => color.isActive);

    return {
        colors,
        activeColors,
        loading,
        hasLoaded,
        error,
        refresh: getColors,
        upsertColor,
    };
}
