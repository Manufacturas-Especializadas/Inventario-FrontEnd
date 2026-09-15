import {
    useCallback,
    useRef,
    useState,
} from "react";

import {
    inventoryAdjustmentsService,
} from "../api/services/InventoryAdjustmentsService";

import type {
    CreateInventoryAdjustmentRequest,
    InventoryAdjustment,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


export const useInventoryAdjustments = () => {
    const lookupRequestId = useRef(0);

    const [
        adjustment,
        setAdjustment,
    ] = useState<InventoryAdjustment | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        creating,
        setCreating,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    const getByFolio =
        useCallback(
            async (
                folio: string
            ): Promise<InventoryAdjustment | null> => {
                const currentRequestId = ++lookupRequestId.current;
                const normalizedFolio =
                    folio.trim();

                if (!normalizedFolio) {
                    setLoading(false);
                    setAdjustment(null);

                    setError(
                        "Ingresa un folio de ajuste."
                    );

                    return null;
                }

                setLoading(true);
                setError(null);

                try {
                    const data =
                        await inventoryAdjustmentsService
                            .getByFolio(
                                normalizedFolio
                            );

                    if (currentRequestId !== lookupRequestId.current) return null;
                    setAdjustment(
                        data
                    );

                    return data;
                } catch (error) {
                    if (currentRequestId !== lookupRequestId.current) return null;
                    setAdjustment(
                        null
                    );

                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar el ajuste de inventario."
                        )
                    );

                    return null;
                } finally {
                    if (currentRequestId === lookupRequestId.current) {
                        setLoading(false);
                    }
                }
            },
            []
        );


    const createAdjustment =
        useCallback(
            async (
                request:
                    CreateInventoryAdjustmentRequest
            ): Promise<InventoryAdjustment | null> => {
                setCreating(true);
                setError(null);

                try {
                    const data =
                        await inventoryAdjustmentsService
                            .create(
                                request
                            );

                    setAdjustment(
                        data
                    );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible crear el ajuste de inventario."
                        )
                    );

                    return null;
                } finally {
                    setCreating(false);
                }
            },
            []
        );


    const clearAdjustment =
        useCallback(() => {
            lookupRequestId.current += 1;
            setLoading(false);
            setAdjustment(
                null
            );

            setError(
                null
            );
        }, []);


    return {
        adjustment,

        loading,
        creating,

        error,

        getByFolio,
        createAdjustment,
        clearAdjustment,
    };
};
