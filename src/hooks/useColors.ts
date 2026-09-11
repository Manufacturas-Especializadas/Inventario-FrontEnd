import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    colorsService,
} from "../api/services/colorsService";

import type {
    ProductColor,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export function useColors() {
    const [colors, setColors] =
        useState<ProductColor[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const getColors =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await colorsService.getAll();

                setColors(data);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No se pudieron cargar los colores."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getColors();
    }, [getColors]);

    const activeColors =
        colors.filter(
            (color) => color.isActive
        );

    return {
        colors,
        activeColors,
        loading,
        error,
        refresh: getColors,
    };
}