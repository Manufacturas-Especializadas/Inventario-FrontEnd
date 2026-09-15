import { useCallback, useEffect, useRef, useState } from "react";
import { sizesService } from "../api/services/sizesService";
import type { ProductSize } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface UseSizesOptions {
    autoLoad?: boolean;
}

export function useSizes({ autoLoad = true }: UseSizesOptions = {}) {
    const [sizes, setSizes] = useState<ProductSize[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, ProductSize>());

    const getSizes = useCallback(() => {
        if (pendingRequest.current) {
            return pendingRequest.current;
        }

        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();

        const request = (async () => {
            try {
                const data = await sizesService.getAll();
                // Preserve successful mutations that finished while this GET was pending.
                const merged = new Map(data.map((size) => [size.id, size]));
                updatesDuringLoad.current.forEach((size) => {
                    merged.set(size.id, size);
                });
                setSizes(Array.from(merged.values()));
                setHasLoaded(true);
            } catch (error) {
                setError(getApiErrorMessage(error, "No se pudieron cargar las tallas."));
            } finally {
                setLoading(false);
                pendingRequest.current = null;
                updatesDuringLoad.current.clear();
            }
        })();

        pendingRequest.current = request;
        return request;
    }, []);

    const upsertSize = useCallback((size: ProductSize) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(size.id, size);
        }

        setSizes((current) => current.some((entry) => entry.id === size.id)
            ? current.map((entry) => entry.id === size.id ? size : entry)
            : [...current, size]);
    }, []);

    useEffect(() => {
        if (autoLoad) {
            void getSizes();
        }
    }, [autoLoad, getSizes]);

    const activeSizes = sizes.filter((size) => size.isActive);

    return {
        sizes,
        activeSizes,
        loading,
        hasLoaded,
        error,
        refresh: getSizes,
        upsertSize,
    };
}
