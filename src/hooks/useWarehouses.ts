import {
    useCallback,
    useEffect,
    useRef,
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
    const loaded = useRef(false);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, Warehouse>());

    const getWarehouses =
        useCallback(() => {
            if (pendingRequest.current) return pendingRequest.current;
            setLoading(true);
            setError(null);
            updatesDuringLoad.current.clear();
            const request = (async () => {
                try {
                    const data =
                        await warehousesService
                            .getAll();

                    const merged = new Map(data.map((warehouse) => [warehouse.id, warehouse]));
                    updatesDuringLoad.current.forEach((warehouse) => merged.set(warehouse.id, warehouse));
                    setWarehouses(Array.from(merged.values()));
                    loaded.current = true;
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
                    pendingRequest.current = null;
                    updatesDuringLoad.current.clear();
                }
            })();
            pendingRequest.current = request;
            return request;
        }, []);

    const upsertWarehouse = useCallback((warehouse: Warehouse) => {
        if (pendingRequest.current) updatesDuringLoad.current.set(warehouse.id, warehouse);
        // A mutation alone does not establish a complete warehouse list.
        if (!loaded.current) return;
        setWarehouses((current) => current.some((entry) => entry.id === warehouse.id)
            ? current.map((entry) => entry.id === warehouse.id ? warehouse : entry)
            : [...current, warehouse]);
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
        upsertWarehouse,
        refresh: getWarehouses,
    };
};
