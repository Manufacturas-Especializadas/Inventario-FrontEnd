import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    organizationalUnitPPELimitsService,
} from "../api/services/OrganizationalUnitPPELimitsService";

import type {
    OrganizationalUnitPPELimit,
    SetOrganizationalUnitPPELimitRequest,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface GetLimitsParams {
    organizationalUnitId?:
    number | null;

    ppeProductId?:
    number | null;
}


export const useOrganizationalUnitPPELimits =
    () => {
        const [
            limits,
            setLimits,
        ] = useState<
            OrganizationalUnitPPELimit[]
        >([]);

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            saving,
            setSaving,
        ] = useState(false);

        const [
            error,
            setError,
        ] = useState<
            string | null
        >(null);


        const getLimits =
            useCallback(
                async (
                    params?:
                        GetLimitsParams
                ): Promise<
                    OrganizationalUnitPPELimit[]
                > => {
                    setLoading(true);
                    setError(null);

                    try {
                        const data =
                            await organizationalUnitPPELimitsService
                                .getAll(
                                    params
                                );

                        setLimits(
                            data
                        );

                        return data;
                    } catch (error) {
                        setLimits(
                            []
                        );

                        setError(
                            getApiErrorMessage(
                                error,
                                "No fue posible consultar los límites de EPP."
                            )
                        );

                        return [];
                    } finally {
                        setLoading(false);
                    }
                },
                []
            );


        const setLimit =
            useCallback(
                async (
                    request:
                        SetOrganizationalUnitPPELimitRequest
                ): Promise<
                    OrganizationalUnitPPELimit | null
                > => {
                    if (
                        !Number.isInteger(
                            request.maxQuantityPerCycle
                        ) ||
                        request.maxQuantityPerCycle <=
                        0
                    ) {
                        setError(
                            "El máximo por ciclo debe ser un número entero mayor a cero."
                        );

                        return null;
                    }

                    setSaving(true);
                    setError(null);

                    try {
                        const data =
                            await organizationalUnitPPELimitsService
                                .set(
                                    request
                                );

                        setLimits(
                            (current) => {
                                const exists =
                                    current.some(
                                        (
                                            limit
                                        ) =>
                                            limit.id ===
                                            data.id
                                    );

                                if (
                                    exists
                                ) {
                                    return current.map(
                                        (
                                            limit
                                        ) =>
                                            limit.id ===
                                                data.id
                                                ? data
                                                : limit
                                    );
                                }

                                return [
                                    ...current,
                                    data,
                                ];
                            }
                        );

                        return data;
                    } catch (error) {
                        setError(
                            getApiErrorMessage(
                                error,
                                "No fue posible guardar el límite de EPP."
                            )
                        );

                        return null;
                    } finally {
                        setSaving(false);
                    }
                },
                []
            );


        const clearError =
            useCallback(
                () => {
                    setError(
                        null
                    );
                },
                []
            );


        const refresh =
            useCallback(
                async () => {
                    await getLimits();
                },
                [getLimits]
            );


        useEffect(() => {
            void refresh();
        }, [refresh]);


        return {
            limits,

            loading,
            saving,

            error,

            getLimits,
            setLimit,

            refresh,
            clearError,
        };
    };