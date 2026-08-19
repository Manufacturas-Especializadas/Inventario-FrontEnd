import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    ppeProductsService,
} from "../api/services/PPEProductsService";

import type {
    PPEProduct,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const usePPEProducts = () => {
    const [
        products,
        setProducts,
    ] = useState<PPEProduct[]>([]);

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

    const getProducts =
        useCallback(async () => {
            setLoading(true);

            setError(null);

            try {
                const data =
                    await ppeProductsService
                        .getAll();

                setProducts(
                    data
                );
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los productos EPP."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        getProducts();
    }, [getProducts]);

    return {
        products,
        loading,
        error,
        refresh:
            getProducts,
    };
};