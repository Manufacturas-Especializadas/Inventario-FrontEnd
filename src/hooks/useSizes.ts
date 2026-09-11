import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    sizesService,
} from "../api/services/sizesService";

import type {
    ProductSize,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export function useSizes() {
    const [sizes, setSizes] =
        useState<ProductSize[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const getSizes =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await sizesService.getAll();

                setSizes(data);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No se pudieron cargar las tallas."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getSizes();
    }, [getSizes]);

    const activeSizes =
        sizes.filter(
            (size) => size.isActive
        );

    return {
        sizes,
        activeSizes,
        loading,
        error,
        refresh: getSizes,
    };
}