import {
    useCallback,
    useEffect,
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

export const useInventory = (
    warehouseId: number | null
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

    const getBalances =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await inventoryService
                        .getBalances(
                            warehouseId
                        );

                setBalances(data);
            } catch (error) {
                setBalances([]);

                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar el inventario."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, [warehouseId]);

    useEffect(() => {
        void getBalances();
    }, [getBalances]);

    return {
        balances,
        loading,
        error,
        refresh: getBalances,
    };
};