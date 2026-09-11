import {
    useCallback,
    useState,
} from "react";

import {
    inventoryCountsService,
} from "../api/services/InventoryCountsService";

import type {
    InventoryCount,
    InventoryCountItem,
    StartInventoryCountRequest,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


export const useInventoryCounts = () => {
    const [
        inventoryCount,
        setInventoryCount,
    ] = useState<InventoryCount | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const [
        savingProductId,
        setSavingProductId,
    ] = useState<number | null>(
        null
    );

    const [
        submitting,
        setSubmitting,
    ] = useState(false);
    const [
        pendingReviewCounts,
        setPendingReviewCounts,
    ] = useState<InventoryCount[]>([]);

    const [
        loadingPendingReview,
        setLoadingPendingReview,
    ] = useState(false);

    const [
        postingFolio,
        setPostingFolio,
    ] = useState<string | null>(
        null
    );

    const [
        reviewError,
        setReviewError,
    ] = useState<string | null>(
        null
    );

    const getPendingReview =
        useCallback(
            async (): Promise<
                InventoryCount[]
            > => {
                setLoadingPendingReview(
                    true
                );

                setReviewError(
                    null
                );

                try {
                    const data =
                        await inventoryCountsService
                            .getPendingReview();

                    setPendingReviewCounts(
                        data
                    );

                    return data;
                } catch (error) {
                    setPendingReviewCounts(
                        []
                    );

                    setReviewError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar los conteos pendientes de revisión."
                        )
                    );

                    return [];
                } finally {
                    setLoadingPendingReview(
                        false
                    );
                }
            },
            []
        );

    const postCount =
        useCallback(
            async (
                folio: string
            ): Promise<
                InventoryCount | null
            > => {
                setPostingFolio(
                    folio
                );

                setReviewError(
                    null
                );

                try {
                    const data =
                        await inventoryCountsService
                            .post(
                                folio
                            );

                    setPendingReviewCounts(
                        (current) =>
                            current.filter(
                                (count) =>
                                    count.folio !==
                                    data.folio
                            )
                    );

                    if (
                        inventoryCount?.folio ===
                        data.folio
                    ) {
                        setInventoryCount(
                            data
                        );
                    }

                    return data;
                } catch (error) {
                    setReviewError(
                        getApiErrorMessage(
                            error,
                            "No fue posible publicar el conteo físico."
                        )
                    );

                    return null;
                } finally {
                    setPostingFolio(
                        null
                    );
                }
            },
            [
                inventoryCount?.folio,
            ]
        );


    const getByFolio =
        useCallback(
            async (
                folio: string
            ): Promise<InventoryCount | null> => {
                const normalizedFolio =
                    folio.trim();

                if (!normalizedFolio) {
                    setError(
                        "Ingresa un folio de conteo."
                    );

                    return null;
                }

                setLoading(true);
                setError(null);

                try {
                    const data =
                        await inventoryCountsService
                            .getByFolio(
                                normalizedFolio
                            );

                    setInventoryCount(
                        data
                    );

                    return data;
                } catch (error) {
                    setInventoryCount(
                        null
                    );

                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar el conteo físico."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );


    const startCount =
        useCallback(
            async (
                request:
                    StartInventoryCountRequest
            ): Promise<InventoryCount | null> => {
                setLoading(true);
                setError(null);

                try {
                    const data =
                        await inventoryCountsService
                            .start(
                                request
                            );

                    setInventoryCount(
                        data
                    );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible iniciar el conteo físico."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );


    const captureItem =
        useCallback(
            async (
                folio: string,
                ppeProductId: number,
                countedQuantity: number
            ): Promise<InventoryCountItem | null> => {
                if (
                    !Number.isInteger(
                        countedQuantity
                    ) ||
                    countedQuantity < 0
                ) {
                    setError(
                        "La cantidad contada debe ser un número entero igual o mayor a cero."
                    );

                    return null;
                }

                setSavingProductId(
                    ppeProductId
                );

                setError(null);

                try {
                    const data =
                        await inventoryCountsService
                            .captureItem(
                                folio,
                                ppeProductId,
                                {
                                    countedQuantity,
                                }
                            );

                    setInventoryCount(
                        (current) => {
                            if (!current) {
                                return current;
                            }

                            return {
                                ...current,

                                items:
                                    current.items.map(
                                        (
                                            item
                                        ) =>
                                            item.ppeProductId ===
                                                data.ppeProductId
                                                ? data
                                                : item
                                    ),
                            };
                        }
                    );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible guardar la cantidad contada."
                        )
                    );

                    return null;
                } finally {
                    setSavingProductId(
                        null
                    );
                }
            },
            []
        );


    const submitCount =
        useCallback(
            async (
                folio: string
            ): Promise<InventoryCount | null> => {
                setSubmitting(true);
                setError(null);

                try {
                    const data =
                        await inventoryCountsService
                            .submit(
                                folio
                            );

                    setInventoryCount(
                        data
                    );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible enviar el conteo a revisión."
                        )
                    );

                    return null;
                } finally {
                    setSubmitting(false);
                }
            },
            []
        );


    const clearCount =
        useCallback(() => {
            setInventoryCount(
                null
            );

            setError(
                null
            );

            setSavingProductId(
                null
            );
        }, []);


    return {
        inventoryCount,

        loading,
        savingProductId,
        submitting,

        error,

        getByFolio,
        startCount,
        captureItem,
        submitCount,
        clearCount,
        pendingReviewCounts,

        loadingPendingReview,
        postingFolio,

        reviewError,

        getPendingReview,
        postCount,
    };
};