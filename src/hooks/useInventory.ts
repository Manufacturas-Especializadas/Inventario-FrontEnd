import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    inventoryService,
} from "../api/services/InventoryService";

import type {
    InventoryBalance,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

interface UseInventoryOptions {
    autoLoad?: boolean;
}

export const useInventory = (
    warehouseId: number | null,
    { autoLoad = true }: UseInventoryOptions = {}
) => {
    const [
        balances,
        setBalances,
    ] = useState<InventoryBalance[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const [hasLoaded, setHasLoaded] = useState(false);
    const requestId = useRef(0);
    const pendingRequest = useRef<{
        warehouseId: number | null;
        promise: Promise<void>;
    } | null>(null);

    const invalidate = useCallback(() => {
        requestId.current += 1;
        pendingRequest.current = null;
        setBalances([]);
        setHasLoaded(false);
        setLoading(false);
        setError(null);
    }, []);

    const getBalances =
        useCallback(() => {
            if (pendingRequest.current?.warehouseId === warehouseId) {
                return pendingRequest.current.promise;
            }

            const currentRequestId = ++requestId.current;
            setLoading(true);
            setError(null);

            const request = (async () => {
                try {
                    const data =
                        await inventoryService
                            .getBalances(
                                warehouseId
                            );

                    // Ignore responses from a query invalidated by a warehouse change.
                    if (currentRequestId !== requestId.current) return;
                    setBalances(data);
                    setHasLoaded(true);
                } catch (error) {
                    if (currentRequestId !== requestId.current) return;
                    setBalances([]);
                    setHasLoaded(false);

                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar el inventario."
                        )
                    );
                } finally {
                    if (currentRequestId === requestId.current) {
                        setLoading(false);
                        pendingRequest.current = null;
                    }
                }
            })();

            pendingRequest.current = { warehouseId, promise: request };
            return request;
        }, [warehouseId]);

    useEffect(() => {
        if (autoLoad) {
            void getBalances();
        }
    }, [autoLoad, getBalances]);

    return {
        balances,
        loading,
        error,
        hasLoaded,
        refresh: getBalances,
        invalidate,
    };
};
