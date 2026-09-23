import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    auditLogsService,
} from "../api/services/AuditLogsService";

import type {
    AuditLog,
    GetAuditLogsParams,
    PagedResult,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


const initialResult: PagedResult<AuditLog> = {
    items: [],
    pageNumber: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
};


export const useAuditLogs = () => {
    const [
        result,
        setResult,
    ] =
        useState<
            PagedResult<AuditLog>
        >(initialResult);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null
        );


    const getAuditLogs =
        useCallback(
            async (
                params?:
                    GetAuditLogsParams
            ): Promise<
                PagedResult<AuditLog> | null
            > => {
                const pageNumber =
                    params?.pageNumber ??
                    1;

                const pageSize =
                    params?.pageSize ??
                    25;


                if (
                    !Number.isInteger(
                        pageNumber
                    ) ||
                    pageNumber < 1
                ) {
                    setError(
                        "El número de página debe ser mayor o igual a 1."
                    );

                    return null;
                }


                if (
                    !Number.isInteger(
                        pageSize
                    ) ||
                    pageSize < 1 ||
                    pageSize > 100
                ) {
                    setError(
                        "El tamaño de página debe estar entre 1 y 100."
                    );

                    return null;
                }


                if (
                    params?.performedByUserId !=
                    null &&
                    (
                        !Number.isInteger(
                            params
                                .performedByUserId
                        ) ||
                        params
                            .performedByUserId <=
                        0
                    )
                ) {
                    setError(
                        "El identificador del usuario debe ser mayor a cero."
                    );

                    return null;
                }


                if (
                    params?.dateFrom &&
                    params?.dateTo &&
                    new Date(
                        params.dateTo
                    ).getTime() <
                    new Date(
                        params.dateFrom
                    ).getTime()
                ) {
                    setError(
                        "La fecha final no puede ser anterior a la fecha inicial."
                    );

                    return null;
                }


                setLoading(true);
                setError(null);

                try {
                    const data =
                        await auditLogsService
                            .getAll({
                                ...params,
                                pageNumber,
                                pageSize,
                            });

                    setResult(
                        data
                    );

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar la auditoría."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );


    const clearError =
        useCallback(() => {
            setError(
                null
            );
        }, []);


    const reset =
        useCallback(() => {
            setResult(
                initialResult
            );

            setError(
                null
            );
        }, []);


    useEffect(() => {
        void getAuditLogs({
            pageNumber: 1,
            pageSize: 25,
        });
    }, [getAuditLogs]);


    return {
        auditLogs:
            result.items,

        pageNumber:
            result.pageNumber,

        pageSize:
            result.pageSize,

        totalCount:
            result.totalCount,

        totalPages:
            result.totalPages,

        hasPreviousPage:
            result.hasPreviousPage,

        hasNextPage:
            result.hasNextPage,

        loading,
        error,

        getAuditLogs,

        clearError,
        reset,
    };
};