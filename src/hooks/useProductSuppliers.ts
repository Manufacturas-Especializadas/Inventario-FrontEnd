import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    productSuppliersService,
} from "../api/services/ProductSuppliersService";

import type {
    ProductSupplier,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const useProductSuppliers = (
    ppeProductId: number | null
) => {
    const [
        productSuppliers,
        setProductSuppliers,
    ] = useState<ProductSupplier[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const getProductSuppliers =
        useCallback(async () => {
            if (!ppeProductId) {
                setProductSuppliers([]);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data =
                    await productSuppliersService
                        .getByProduct(
                            ppeProductId
                        );

                setProductSuppliers(data);
            } catch (error) {
                setProductSuppliers([]);

                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los proveedores del producto."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, [ppeProductId]);

    useEffect(() => {
        void getProductSuppliers();
    }, [getProductSuppliers]);

    return {
        productSuppliers,
        loading,
        error,
        refresh: getProductSuppliers,
    };
};