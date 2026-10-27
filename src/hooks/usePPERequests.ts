import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ppeRequestsService,
} from "../api/services/PPERequestsService";

import type {
    CancelPPERequestResult,
    CreatePPERequestRequest,
    CreatePPERequestResult,
    DeliverPPERequestResult,
    PPERequest,
    PendingPPERequest,
    GetPendingPPERequestsParams,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface UsePPERequestsOptions {
    autoLoadPending?: boolean;
}

export const usePPERequests = ({ autoLoadPending = true }: UsePPERequestsOptions = {}) => {
    const pendingRequestId = useRef(0);

    const pendingLoad = useRef<{
        key: string;
        promise: Promise<PendingPPERequest[]>;
    } | null>(null);

    const pendingMutations =
        useRef(
            new Map<
                string,
                PendingPPERequest | null
            >()
        );

    const [pendingHasLoaded, setPendingHasLoaded] = useState(false);
    const historyRequestId = useRef(0);

    const [
        pendingPageNumber,
        setPendingPageNumber,
    ] = useState(1);

    const [
        pendingPageSize,
        setPendingPageSize,
    ] = useState(25);

    const [
        pendingTotalCount,
        setPendingTotalCount,
    ] = useState(0);

    const [
        pendingTotalPages,
        setPendingTotalPages,
    ] = useState(0);

    const [
        pendingHasPreviousPage,
        setPendingHasPreviousPage,
    ] = useState(false);

    const [
        pendingHasNextPage,
        setPendingHasNextPage,
    ] = useState(false);

    const [
        pendingRequests,
        setPendingRequests,
    ] = useState<PendingPPERequest[]>([]);

    const [
        createResult,
        setCreateResult,
    ] = useState<CreatePPERequestResult | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        loadingPending,
        setLoadingPending,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const [
        pendingError,
        setPendingError,
    ] = useState<string | null>(
        null
    );

    const [
        cancellingFolio,
        setCancellingFolio,
    ] = useState<string | null>(
        null
    );

    const [
        cancelError,
        setCancelError,
    ] = useState<string | null>(
        null
    );

    const [
        deliveringFolio,
        setDeliveringFolio,
    ] = useState<string | null>(
        null
    );

    const [
        deliverError,
        setDeliverError,
    ] = useState<string | null>(
        null
    );

    const [
        history,
        setHistory,
    ] = useState<PPERequest[]>([]);

    const [
        historyPageNumber,
        setHistoryPageNumber,
    ] = useState(1);

    const [
        historyTotalCount,
        setHistoryTotalCount,
    ] = useState(0);

    const [
        historyTotalPages,
        setHistoryTotalPages,
    ] = useState(0);

    const [
        historyHasPreviousPage,
        setHistoryHasPreviousPage,
    ] = useState(false);

    const [
        historyHasNextPage,
        setHistoryHasNextPage,
    ] = useState(false);

    const [
        loadingHistory,
        setLoadingHistory,
    ] = useState(false);

    const [
        historyError,
        setHistoryError,
    ] = useState<string | null>(
        null
    );

    const clearHistory =
        useCallback(() => {
            historyRequestId.current += 1;

            setLoadingHistory(false);
            setHistory([]);
            setHistoryError(null);

            setHistoryPageNumber(1);
            setHistoryTotalCount(0);
            setHistoryTotalPages(0);
            setHistoryHasPreviousPage(false);
            setHistoryHasNextPage(false);
        }, []);


    const clearPending = useCallback(() => {
        pendingRequestId.current += 1;
        pendingLoad.current = null;
        pendingMutations.current.clear();

        setPendingHasLoaded(false);
        setPendingRequests([]);
        setPendingError(null);
        setLoadingPending(false);

        setPendingPageNumber(1);
        setPendingPageSize(25);
        setPendingTotalCount(0);
        setPendingTotalPages(0);
        setPendingHasPreviousPage(false);
        setPendingHasNextPage(false);
    }, []);

    const getPending = useCallback(
        (
            params:
                GetPendingPPERequestsParams = {}
        ): Promise<PendingPPERequest[]> => {
            const normalizedParams = {
                warehouseId:
                    params.warehouseId ?? null,

                search:
                    params.search?.trim() ||
                    null,

                requestedForOrganizationalUnitId:
                    params.requestedForOrganizationalUnitId ??
                    null,

                dateFrom:
                    params.dateFrom || null,

                dateTo:
                    params.dateTo || null,

                pageNumber:
                    params.pageNumber ?? 1,

                pageSize:
                    params.pageSize ?? 25,
            };

            const key =
                JSON.stringify(
                    normalizedParams
                );

            if (
                pendingLoad.current?.key ===
                key
            ) {
                return pendingLoad.current
                    .promise;
            }

            const currentRequestId =
                ++pendingRequestId.current;

            pendingMutations.current.clear();

            setLoadingPending(true);
            setPendingError(null);

            const promise = (async () => {
                try {
                    const data =
                        await ppeRequestsService
                            .getPending(
                                normalizedParams
                            );

                    if (
                        currentRequestId !==
                        pendingRequestId.current
                    ) {
                        return [];
                    }

                    /*
                     * Una operación local de entrega o cancelación
                     * no debe ser revertida por una consulta que
                     * comenzó antes de dicha operación.
                     */
                    const merged =
                        new Map(
                            data.items.map(
                                (entry) => [
                                    entry.folio,
                                    entry,
                                ]
                            )
                        );

                    pendingMutations.current
                        .forEach(
                            (
                                entry,
                                folio
                            ) => {
                                if (entry) {
                                    merged.set(
                                        folio,
                                        entry
                                    );
                                } else {
                                    merged.delete(
                                        folio
                                    );
                                }
                            }
                        );

                    const pending =
                        Array.from(
                            merged.values()
                        );

                    setPendingRequests(
                        pending
                    );

                    setPendingPageNumber(
                        data.pageNumber
                    );

                    setPendingPageSize(
                        data.pageSize
                    );

                    setPendingTotalCount(
                        data.totalCount
                    );

                    setPendingTotalPages(
                        data.totalPages
                    );

                    setPendingHasPreviousPage(
                        data.hasPreviousPage
                    );

                    setPendingHasNextPage(
                        data.hasNextPage
                    );

                    setPendingHasLoaded(
                        true
                    );

                    return pending;
                } catch (error) {
                    if (
                        currentRequestId !==
                        pendingRequestId.current
                    ) {
                        return [];
                    }

                    setPendingError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar las solicitudes pendientes."
                        )
                    );

                    return [];
                } finally {
                    if (
                        currentRequestId ===
                        pendingRequestId.current
                    ) {
                        setLoadingPending(
                            false
                        );

                        pendingLoad.current =
                            null;

                        pendingMutations.current
                            .clear();
                    }
                }
            })();

            pendingLoad.current = {
                key,
                promise,
            };

            return promise;
        },
        []
    );

    const removePending = useCallback((folio: string) => {
        if (pendingLoad.current) pendingMutations.current.set(folio, null);
        setPendingRequests((current) => current.filter((entry) => entry.folio !== folio));
    }, []);



    const getByFolio =
        useCallback(
            async (
                folio: string
            ): Promise<PPERequest | null> => {
                setLoading(true);
                setError(null);

                try {
                    const data =
                        await ppeRequestsService
                            .getByFolio(
                                folio
                            );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible encontrar la solicitud EPP."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );


    const createRequest =
        useCallback(
            async (
                request:
                    CreatePPERequestRequest
            ): Promise<CreatePPERequestResult | null> => {
                setLoading(true);
                setError(null);
                setCreateResult(null);

                try {
                    const data =
                        await ppeRequestsService
                            .create(
                                request
                            );

                    setCreateResult(data);

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible crear la solicitud EPP."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );

    const cancelRequest =
        useCallback(
            async (
                folio: string,
                cancellationReason: string
            ): Promise<CancelPPERequestResult | null> => {
                const normalizedReason =
                    cancellationReason.trim();

                if (!normalizedReason) {
                    setCancelError(
                        "El motivo de cancelación es obligatorio."
                    );

                    return null;
                }

                if (
                    normalizedReason.length > 500
                ) {
                    setCancelError(
                        "El motivo de cancelación no puede superar los 500 caracteres."
                    );

                    return null;
                }

                setCancellingFolio(
                    folio
                );

                setCancelError(null);

                try {
                    const data =
                        await ppeRequestsService
                            .cancel(
                                folio,
                                {
                                    cancellationReason:
                                        normalizedReason,
                                }
                            );

                    removePending(data.folio);

                    return data;
                } catch (error) {
                    setCancelError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cancelar la solicitud EPP."
                        )
                    );

                    return null;
                } finally {
                    setCancellingFolio(
                        null
                    );
                }
            },
            [removePending]
        );


    const clearRequest =
        useCallback(() => {
            setCreateResult(null);

            setError(null);
        }, []);

    const clearDeliverError =
        useCallback(() => {
            setDeliverError(null);
        }, []);


    useEffect(() => {
        if (autoLoadPending) {
            void getPending();
        }
    }, [autoLoadPending, getPending]);

    const deliverRequest =
        useCallback(
            async (
                folio: string,
                employeeNumber: string
            ): Promise<DeliverPPERequestResult | null> => {
                const normalizedEmployeeNumber =
                    employeeNumber.trim();

                if (!normalizedEmployeeNumber) {
                    setDeliverError(
                        "El número de empleado es obligatorio."
                    );

                    return null;
                }

                setDeliveringFolio(
                    folio
                );

                setDeliverError(null);

                try {
                    const data =
                        await ppeRequestsService
                            .deliver(
                                folio,
                                {
                                    employeeNumber:
                                        normalizedEmployeeNumber,
                                }
                            );

                    removePending(data.folio);

                    return data;
                } catch (error) {
                    setDeliverError(
                        getApiErrorMessage(
                            error,
                            "No fue posible entregar la solicitud EPP."
                        )
                    );

                    return null;
                } finally {
                    setDeliveringFolio(
                        null
                    );
                }
            },
            [removePending]
        );

    const getHistory =
        useCallback(
            async (
                employeeNumber: string,
                pageNumber = 1
            ): Promise<PPERequest[]> => {
                const currentRequestId =
                    ++historyRequestId.current;

                const normalizedEmployeeNumber =
                    employeeNumber.trim();

                if (!normalizedEmployeeNumber) {
                    setLoadingHistory(false);
                    setHistory([]);

                    setHistoryPageNumber(1);
                    setHistoryTotalCount(0);
                    setHistoryTotalPages(0);
                    setHistoryHasPreviousPage(false);
                    setHistoryHasNextPage(false);

                    setHistoryError(
                        "Ingresa un número de empleado."
                    );

                    return [];
                }

                setLoadingHistory(true);
                setHistoryError(null);

                try {
                    const data =
                        await ppeRequestsService
                            .getHistory(
                                normalizedEmployeeNumber,
                                pageNumber,
                                25
                            );

                    if (
                        currentRequestId !==
                        historyRequestId.current
                    ) {
                        return [];
                    }

                    setHistory(
                        data.items
                    );

                    setHistoryPageNumber(
                        data.pageNumber
                    );

                    setHistoryTotalCount(
                        data.totalCount
                    );

                    setHistoryTotalPages(
                        data.totalPages
                    );

                    setHistoryHasPreviousPage(
                        data.hasPreviousPage
                    );

                    setHistoryHasNextPage(
                        data.hasNextPage
                    );

                    return data.items;
                } catch (error) {
                    if (
                        currentRequestId !==
                        historyRequestId.current
                    ) {
                        return [];
                    }

                    setHistory([]);

                    setHistoryError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar el historial de EPP."
                        )
                    );

                    return [];
                } finally {
                    if (
                        currentRequestId ===
                        historyRequestId.current
                    ) {
                        setLoadingHistory(false);
                    }
                }
            },
            []
        );


    return {
        pendingRequests,
        pendingHasLoaded,

        pendingPageNumber,
        pendingPageSize,
        pendingTotalCount,
        pendingTotalPages,
        pendingHasPreviousPage,
        pendingHasNextPage,

        createResult,

        loading,
        loadingPending,

        error,
        pendingError,

        getByFolio,
        getPending,
        clearPending,

        createRequest,
        clearRequest,

        cancellingFolio,
        cancelError,
        cancelRequest,

        deliveringFolio,
        deliverError,
        clearDeliverError,
        deliverRequest,

        history,
        loadingHistory,
        historyError,
        getHistory,
        clearHistory,

        historyPageNumber,
        historyTotalCount,
        historyTotalPages,
        historyHasPreviousPage,
        historyHasNextPage,
    };
};
