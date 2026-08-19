import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ppeCategoriesService,
} from "../api/services/PPECategoriesService";

import type {
    PPECategory,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const usePPECategories = () => {
    const [
        categories,
        setCategories,
    ] = useState<PPECategory[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const getCategories =
        useCallback(async () => {
            setLoading(true);

            setError(null);

            try {
                const data =
                    await ppeCategoriesService
                        .getAll();

                setCategories(
                    data
                );
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar las categorías."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    return {
        categories,
        loading,
        error,
        refresh:
            getCategories,
    };
};