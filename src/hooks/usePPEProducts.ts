import { useCallback, useEffect, useRef, useState } from "react";
import { ppeProductsService } from "../api/services/PPEProductsService";
import type { PPEProduct } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface UsePPEProductsOptions {
    autoLoad?: boolean;
}

export function usePPEProducts({ autoLoad = true }: UsePPEProductsOptions = {}) {
    const [products, setProducts] = useState<PPEProduct[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, PPEProduct>());

    const getProducts = useCallback(() => {
        if (pendingRequest.current) {
            return pendingRequest.current;
        }

        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();

        const request = (async () => {
            try {
                const data = await ppeProductsService.getAll();
                // Preserve successful mutations that finished while this GET was pending.
                const merged = new Map(data.map((product) => [product.id, product]));
                updatesDuringLoad.current.forEach((product) => {
                    merged.set(product.id, product);
                });
                setProducts(Array.from(merged.values()));
                setHasLoaded(true);
            } catch (error) {
                setError(getApiErrorMessage(error, "No se pudieron cargar los productes."));
            } finally {
                setLoading(false);
                pendingRequest.current = null;
                updatesDuringLoad.current.clear();
            }
        })();

        pendingRequest.current = request;
        return request;
    }, []);

    const upsertProduct = useCallback((product: PPEProduct) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(product.id, product);
        }

        setProducts((current) => current.some((entry) => entry.id === product.id)
            ? current.map((entry) => entry.id === product.id ? product : entry)
            : [...current, product]);
    }, []);

    useEffect(() => {
        if (autoLoad) {
            void getProducts();
        }
    }, [autoLoad, getProducts]);

    return {
        products,
        loading,
        hasLoaded,
        error,
        refresh: getProducts,
        upsertProduct,
    };
}
