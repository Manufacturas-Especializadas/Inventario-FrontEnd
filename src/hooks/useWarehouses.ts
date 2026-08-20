import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    warehousesService,
} from "../api/services/WarehousesService";

import type {
    Warehouse,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const useWarehouses = () => {
    const [
        warehouses,
        setWarehouses,
    ] = useState<Warehouse[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const getWarehouses =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await warehousesService
                        .getAll();

                setWarehouses(data);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los almacenes."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getWarehouses();
    }, [getWarehouses]);

    return {
        warehouses,
        loading,
        error,
        refresh: getWarehouses,
    };
};