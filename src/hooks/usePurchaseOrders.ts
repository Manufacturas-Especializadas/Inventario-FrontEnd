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
    PurchaseOrderStatus,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

interface UsePurchaseOrdersOptions {
    autoLoad?: boolean;
    initialPageNumber?: number;
    pageSize?: number;
    status?: PurchaseOrderStatus;
}

export const usePurchaseOrders = ({
    autoLoad = true,
    initialPageNumber = 1,
    pageSize = 25,
    status,
}: UsePurchaseOrdersOptions = {}) => {
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

    const [
        hasLoaded,
        setHasLoaded,
    ] = useState(false);

    const [
        pageNumber,
        setPageNumber,
    ] = useState(initialPageNumber);

    const [
        totalCount,
        setTotalCount,
    ] = useState(0);

    const [
        totalPages,
        setTotalPages,
    ] = useState(0);

    const [
        hasPreviousPage,
        setHasPreviousPage,
    ] = useState(false);

    const [
        hasNextPage,
        setHasNextPage,
    ] = useState(false);

    const loaded = useRef(false);

    const requestId =
        useRef(0);

    const pendingRequest =
        useRef<{
            pageNumber: number;
            requestId: number;
            promise: Promise<PurchaseOrder[] | null>;
        } | null>(null);

    const updatesDuringLoad =
        useRef(
            new Map<number, PurchaseOrder | null>()
        );

    const getPurchaseOrders =
        useCallback(
            (
                requestedPage = pageNumber
            ): Promise<PurchaseOrder[] | null> => {
                if (
                    pendingRequest.current?.pageNumber ===
                    requestedPage
                ) {
                    return pendingRequest.current.promise;
                }

                const currentRequestId =
                    ++requestId.current;

                setLoading(true);
                setError(null);

                updatesDuringLoad.current.clear();

                const request =
                    (async (): Promise<
                        PurchaseOrder[] | null
                    > => {
                        try {
                            const data =
                                await purchaseOrdersService
                                    .getPage(
                                        requestedPage,
                                        pageSize,
                                        status
                                    );

                            if (
                                currentRequestId !==
                                requestId.current
                            ) {
                                return null;
                            }

                            const merged =
                                new Map<
                                    number,
                                    PurchaseOrder
                                >(
                                    data.items.map(
                                        (order) => [
                                            order.id,
                                            order,
                                        ]
                                    )
                                );

                            updatesDuringLoad.current
                                .forEach(
                                    (
                                        order,
                                        id
                                    ) => {
                                        if (order) {
                                            merged.set(
                                                id,
                                                order
                                            );
                                        } else {
                                            merged.delete(
                                                id
                                            );
                                        }
                                    }
                                );

                            const orders =
                                Array.from(
                                    merged.values()
                                );

                            setPurchaseOrders(
                                orders
                            );

                            setPageNumber(
                                data.pageNumber
                            );

                            setTotalCount(
                                data.totalCount
                            );

                            setTotalPages(
                                data.totalPages
                            );

                            setHasPreviousPage(
                                data.hasPreviousPage
                            );

                            setHasNextPage(
                                data.hasNextPage
                            );

                            loaded.current = true;
                            setHasLoaded(true);

                            return orders;
                        } catch (error) {
                            if (
                                currentRequestId !==
                                requestId.current
                            ) {
                                return null;
                            }

                            setError(
                                getApiErrorMessage(
                                    error,
                                    "No fue posible cargar las órdenes de compra."
                                )
                            );

                            return null;
                        } finally {
                            if (
                                currentRequestId ===
                                requestId.current
                            ) {
                                setLoading(false);
                                pendingRequest.current =
                                    null;

                                updatesDuringLoad.current
                                    .clear();
                            }
                        }
                    })();

                pendingRequest.current = {
                    pageNumber:
                        requestedPage,
                    requestId:
                        currentRequestId,
                    promise:
                        request,
                };

                return request;
            },
            [
                pageNumber,
                pageSize,
                status,
            ]
        );

    const refresh =
        useCallback(
            () =>
                getPurchaseOrders(
                    pageNumber
                ),
            [
                getPurchaseOrders,
                pageNumber,
            ]
        );

    const loadPage =
        useCallback(
            (
                requestedPage: number
            ) =>
                getPurchaseOrders(
                    requestedPage
                ),
            [
                getPurchaseOrders,
            ]
        );

    const upsertPurchaseOrder =
        useCallback(
            (
                order: PurchaseOrder
            ) => {
                if (
                    pendingRequest.current
                ) {
                    updatesDuringLoad.current
                        .set(
                            order.id,
                            order
                        );
                }

                if (!loaded.current) {
                    return;
                }

                setPurchaseOrders(
                    (current) => {
                        const exists =
                            current.some(
                                (entry) =>
                                    entry.id ===
                                    order.id
                            );

                        if (exists) {
                            return current.map(
                                (entry) =>
                                    entry.id ===
                                        order.id
                                        ? order
                                        : entry
                            );
                        }

                        /*
                         * Una orden nueva pertenece
                         * normalmente a la primera página.
                         */
                        if (
                            pageNumber === 1
                        ) {
                            return [
                                order,
                                ...current,
                            ].slice(
                                0,
                                pageSize
                            );
                        }

                        return current;
                    }
                );
            },
            [
                pageNumber,
                pageSize,
            ]
        );

    const removePurchaseOrder =
        useCallback(
            (
                id: number
            ) => {
                if (
                    pendingRequest.current
                ) {
                    updatesDuringLoad.current
                        .set(
                            id,
                            null
                        );
                }

                if (!loaded.current) {
                    return;
                }

                setPurchaseOrders(
                    (current) =>
                        current.filter(
                            (order) =>
                                order.id !== id
                        )
                );
            },
            []
        );

    useEffect(() => {
        if (
            autoLoad &&
            !loaded.current
        ) {
            void getPurchaseOrders(
                initialPageNumber
            );
        }
    }, [
        autoLoad,
        getPurchaseOrders,
        initialPageNumber,
    ]);

    return {
        purchaseOrders,

        pageNumber,
        pageSize,
        totalCount,
        totalPages,
        hasPreviousPage,
        hasNextPage,

        hasLoaded,
        loading,
        error,

        upsertPurchaseOrder,
        removePurchaseOrder,

        refresh,
        loadPage,
    };
};