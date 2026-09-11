import {
    useCallback,
    useEffect,
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


export const usePPERequests = () => {
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
            setHistory([]);
            setHistoryError(null);
        }, []);


    const getPending =
        useCallback(
            async (
                warehouseId?: number | null
            ): Promise<PPERequest[]> => {
                setLoadingPending(true);
                setPendingError(null);

                try {
                    const data =
                        await ppeRequestsService
                            .getPending(
                                warehouseId
                            );

                    setPendingRequests(
                        data
                    );

                    return data;
                } catch (error) {
                    setPendingRequests([]);

                    setPendingError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar las solicitudes pendientes."
                        )
                    );

                    return [];
                } finally {
                    setLoadingPending(false);
                }
            },
            []
        );


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

                    await getPending();

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
            [getPending]
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
        void getPending();
    }, [getPending]);

    const deliverRequest =
        useCallback(
            async (
                folio: string,
                employeeNumber: string,
                warehouseId?: number | null
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

                    await getPending(
                        warehouseId
                    );

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
            [getPending]
        );

    const getHistory =
        useCallback(
            async (
                employeeNumber: string
            ): Promise<PPERequest[]> => {
                const normalizedEmployeeNumber =
                    employeeNumber.trim();

                if (!normalizedEmployeeNumber) {
                    setHistory([]);

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
                                normalizedEmployeeNumber
                            );

                    setHistory(data);

                    return data;
                } catch (error) {
                    setHistory([]);

                    setHistoryError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar el historial de EPP."
                        )
                    );

                    return [];
                } finally {
                    setLoadingHistory(false);
                }
            },
            []
        );


    return {
        request,
        pendingRequests,
        createResult,
        loading,
        loadingPending,
        error,
        clearDeliverError,
        pendingError,
        getByFolio,
        getPending,
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
    };
};