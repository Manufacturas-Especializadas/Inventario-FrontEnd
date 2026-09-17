import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    purchaseOrdersService,
} from "../api/services/PurchaseOrdersService";

import type {
    PurchaseOrder,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

interface UsePurchaseOrdersOptions {
    autoLoad?: boolean;
}

export const usePurchaseOrders = ({ autoLoad = true }: UsePurchaseOrdersOptions = {}) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const loaded = useRef(false);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, PurchaseOrder>());
    const [
        purchaseOrders,
        setPurchaseOrders,
    ] = useState<PurchaseOrder[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(null);

    const getPurchaseOrders =
        useCallback(() => {
            if (pendingRequest.current) return pendingRequest.current;
            setLoading(true);
            setError(null);
            updatesDuringLoad.current.clear();

            const request = (async () => {
                try {
                    const data =
                        await purchaseOrdersService
                            .getAll();

                    const merged = new Map(data.map((order) => [order.id, order]));
                    updatesDuringLoad.current.forEach((order) => merged.set(order.id, order));
                    setPurchaseOrders(Array.from(merged.values()));
                    loaded.current = true;
                    setHasLoaded(true);
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar las órdenes de compra."
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

    const upsertPurchaseOrder = useCallback((order: PurchaseOrder) => {
        if (pendingRequest.current) updatesDuringLoad.current.set(order.id, order);
        // A mutation alone is not a complete list; the first explicit GET establishes it.
        if (!loaded.current) return;
        setPurchaseOrders((current) => current.some((entry) => entry.id === order.id)
            ? current.map((entry) => entry.id === order.id ? order : entry)
            : [...current, order]);
    }, []);

    useEffect(() => {
        if (autoLoad) void getPurchaseOrders();
    }, [autoLoad, getPurchaseOrders]);

    return {
        purchaseOrders,
        hasLoaded,
        upsertPurchaseOrder,
        loading,
        error,
        refresh: getPurchaseOrders,
    };
};
