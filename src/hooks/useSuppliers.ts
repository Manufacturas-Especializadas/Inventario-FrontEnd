import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    suppliersService,
} from "../api/services/SuppliersService";

import type {
    Supplier,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const useSuppliers = () => {
    const [
        suppliers,
        setSuppliers,
    ] = useState<Supplier[]>([]);

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

    const getSuppliers =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await suppliersService
                        .getAll();

                setSuppliers(data);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los proveedores."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getSuppliers();
    }, [getSuppliers]);

    return {
        suppliers,
        loading,
        error,
        refresh: getSuppliers,
    };
};