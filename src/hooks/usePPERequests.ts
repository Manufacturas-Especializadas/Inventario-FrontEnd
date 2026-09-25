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
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface UsePPERequestsOptions {
    autoLoadPending?: boolean;
}

export const usePPERequests = ({ autoLoadPending = true }: UsePPERequestsOptions = {}) => {
    const pendingRequestId = useRef(0);
    const pendingLoad = useRef<{ warehouseId: number | null; promise: Promise<PPERequest[]> } | null>(null);
    const pendingScope = useRef<number | null>(null);
    const pendingLoaded = useRef(false);
    const pendingMutations = useRef(new Map<string, PPERequest | null>());
    const [pendingHasLoaded, setPendingHasLoaded] = useState(false);
    const historyRequestId = useRef(0);

    const [
        request,
        setRequest,
    ] = useState<PPERequest | null>(
        null
    );

    const [
        pendingRequests,
        setPendingRequests,
    ] = useState<PPERequest[]>([]);

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
        pendingLoaded.current = false;
        setPendingHasLoaded(false);
        setPendingRequests([]);
        setPendingError(null);
        setLoadingPending(false);
    }, []);

    const getPending = useCallback((warehouseId?: number | null): Promise<PPERequest[]> => {
        const scope = warehouseId ?? null;
        if (pendingLoad.current?.warehouseId === scope) return pendingLoad.current.promise;
        if (scope !== pendingScope.current) {
            pendingLoaded.current = false;
            setPendingHasLoaded(false);
            setPendingRequests([]);
        }
        pendingScope.current = scope;
        const currentRequestId = ++pendingRequestId.current;
        pendingMutations.current.clear();
        setLoadingPending(true);
        setPendingError(null);

        const promise = (async () => {
            try {
                const data = await ppeRequestsService.getPending(warehouseId);
                if (currentRequestId !== pendingRequestId.current) return [];

                // An older GET must not undo a successful create, cancel or delivery.
                const merged = new Map(data.map((entry) => [entry.folio, entry]));
                pendingMutations.current.forEach((entry, folio) => {
                    if (entry) merged.set(folio, entry);
                    else merged.delete(folio);
                });
                const pending = Array.from(merged.values());
                setPendingRequests(pending);
                pendingLoaded.current = true;
                setPendingHasLoaded(true);
                return pending;
            } catch (error) {
                if (currentRequestId !== pendingRequestId.current) return [];
                setPendingError(getApiErrorMessage(error, "No fue posible cargar las solicitudes pendientes."));
                return [];
            } finally {
                if (currentRequestId === pendingRequestId.current) {
                    setLoadingPending(false);
                    pendingLoad.current = null;
                    pendingMutations.current.clear();
                }
            }
        })();
        pendingLoad.current = { warehouseId: scope, promise };
        return promise;
    }, []);

    const removePending = useCallback((folio: string) => {
        if (pendingLoad.current) pendingMutations.current.set(folio, null);
        setPendingRequests((current) => current.filter((entry) => entry.folio !== folio));
    }, []);

    const upsertPending = useCallback((entry: PPERequest) => {
        if (entry.status !== 1 || (pendingScope.current !== null && entry.warehouseId !== pendingScope.current)) return;
        if (pendingLoad.current) pendingMutations.current.set(entry.folio, entry);
        // A single mutation is not a complete pending list.
        if (pendingLoaded.current) {
            setPendingRequests((current) => current.some((item) => item.folio === entry.folio)
                ? current.map((item) => item.folio === entry.folio ? entry : item)
                : [...current, entry]);
        }
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

                    setRequest(data);

                    return data;
                } catch (error) {
                    setRequest(null);

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
                    upsertPending(data.request);

                    setRequest(
                        data.request
                    );

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
            [upsertPending]
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
            setRequest(null);

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
        request,
        pendingRequests,
        pendingHasLoaded,
        createResult,
        loading,
        loadingPending,
        error,
        clearDeliverError,
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
