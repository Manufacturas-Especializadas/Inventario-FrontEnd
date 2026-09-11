import {
    useCallback,
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
                const normalizedFolio =
                    folio.trim();

                if (!normalizedFolio) {
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

                    setAdjustment(
                        data
                    );

                    return data;
                } catch (error) {
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
                    setLoading(false);
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