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

interface UseWarehousesOptions {
    autoLoad?: boolean;
}

export const useWarehouses = ({ autoLoad = true }: UseWarehousesOptions = {}) => {
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

    const [hasLoaded, setHasLoaded] = useState(false);

    const getWarehouses =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await warehousesService
                        .getAll();

                setWarehouses(data);
                setHasLoaded(true);
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
        if (autoLoad) {
            void getWarehouses();
        }
    }, [autoLoad, getWarehouses]);

    return {
        warehouses,
        loading,
        error,
        hasLoaded,
        refresh: getWarehouses,
    };
};
