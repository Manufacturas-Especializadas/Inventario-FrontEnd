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


    useEffect(() => {
        void getPending();
    }, [getPending]);


    return {
        request,
        pendingRequests,
        createResult,

        loading,
        loadingPending,

        error,
        pendingError,

        getByFolio,
        getPending,
        createRequest,
        clearRequest,
        cancellingFolio,
        cancelError,

        cancelRequest,
    };
};