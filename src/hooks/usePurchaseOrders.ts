import {
    useCallback,
    useEffect,
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

export const usePurchaseOrders = () => {
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
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await purchaseOrdersService
                        .getAll();

                setPurchaseOrders(data);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar las órdenes de compra."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getPurchaseOrders();
    }, [getPurchaseOrders]);

    return {
        purchaseOrders,
        loading,
        error,
        refresh: getPurchaseOrders,
    };
};