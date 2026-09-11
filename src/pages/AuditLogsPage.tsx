import {
    useState,
    type FormEvent,
} from "react";

import {
    useAuditLogs,
} from "../hooks/useAuditLogs";

import type {
    GetAuditLogsParams,
} from "../types/types";


interface AppliedFilters {
    entityName: string;
    performedByUserId:
    number | null;

    dateFrom: string;
    dateTo: string;

    pageSize: number;
}


const formatDateTime = (
    value: string
) => {
    return new Intl.DateTimeFormat(
        "es-MX",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(
        new Date(value)
    );
};


const formatJson = (
    value: string | null
) => {
    if (!value) {
        return null;
    }

    try {
        return JSON.stringify(
            JSON.parse(value),
            null,
            2
        );
    } catch {
        return value;
    }
};


const buildDateFrom = (
    value: string
) => {
    return value
        ? `${value}T00:00:00`
        : null;
};


const buildDateTo = (
    value: string
) => {
    return value
        ? `${value}T23:59:59.999`
        : null;
};


export const AuditLogsPage = () => {
    const {
        auditLogs,

        pageNumber,
        pageSize,

        totalCount,
        totalPages,

        hasPreviousPage,
        hasNextPage,

        loading,
        error,

        getAuditLogs,
    } = useAuditLogs();


    /*
     * Valores actualmente escritos
     * en el formulario.
     */
    const [
        entityName,
        setEntityName,
    ] = useState("");

    const [
        performedByUserId,
        setPerformedByUserId,
    ] = useState("");

    const [
        dateFrom,
        setDateFrom,
    ] = useState("");

    const [
        dateTo,
        setDateTo,
    ] = useState("");

    const [
        selectedPageSize,
        setSelectedPageSize,
    ] = useState(25);


    /*
     * Filtros realmente aplicados.
     *
     * Los separamos del formulario para
     * que cambiar un input no modifique
     * accidentalmente la paginación.
     */
    const [
        appliedFilters,
        setAppliedFilters,
    ] = useState<AppliedFilters>({
        entityName: "",
        performedByUserId:
            null,
        dateFrom: "",
        dateTo: "",
        pageSize: 25,
    });


    const [
        formError,
        setFormError,
    ] = useState<
        string | null
    >(null);


    const [
        expandedLogId,
        setExpandedLogId,
    ] = useState<
        number | null
    >(null);


    const buildParams = (
        filters:
            AppliedFilters,
        targetPage:
            number
    ): GetAuditLogsParams => {
        return {
            entityName:
                filters.entityName ||
                null,

            performedByUserId:
                filters
                    .performedByUserId,

            dateFrom:
                buildDateFrom(
                    filters.dateFrom
                ),

            dateTo:
                buildDateTo(
                    filters.dateTo
                ),

            pageNumber:
                targetPage,

            pageSize:
                filters.pageSize,
        };
    };


    const handleSearch =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(
                null
            );

            setExpandedLogId(
                null
            );


            const normalizedEntity =
                entityName.trim();


            if (
                normalizedEntity.length >
                100
            ) {
                setFormError(
                    "El nombre de la entidad no puede superar los 100 caracteres."
                );

                return;
            }


            let parsedUserId:
                number | null =
                null;

            if (
                performedByUserId.trim()
            ) {
                parsedUserId =
                    Number(
                        performedByUserId
                    );

                if (
                    !Number.isInteger(
                        parsedUserId
                    ) ||
                    parsedUserId <= 0
                ) {
                    setFormError(
                        "El identificador del usuario debe ser un número entero mayor a cero."
                    );

                    return;
                }
            }


            if (
                dateFrom &&
                dateTo &&
                dateTo < dateFrom
            ) {
                setFormError(
                    "La fecha final no puede ser anterior a la fecha inicial."
                );

                return;
            }


            const filters:
                AppliedFilters = {
                entityName:
                    normalizedEntity,

                performedByUserId:
                    parsedUserId,

                dateFrom,
                dateTo,

                pageSize:
                    selectedPageSize,
            };


            setAppliedFilters(
                filters
            );


            await getAuditLogs(
                buildParams(
                    filters,
                    1
                )
            );
        };


    const handleClear =
        async () => {
            setEntityName("");
            setPerformedByUserId(
                ""
            );

            setDateFrom("");
            setDateTo("");

            setSelectedPageSize(
                25
            );

            setFormError(
                null
            );

            setExpandedLogId(
                null
            );


            const filters:
                AppliedFilters = {
                entityName: "",

                performedByUserId:
                    null,

                dateFrom: "",
                dateTo: "",

                pageSize: 25,
            };


            setAppliedFilters(
                filters
            );


            await getAuditLogs(
                buildParams(
                    filters,
                    1
                )
            );
        };


    const goToPage =
        async (
            targetPage:
                number
        ) => {
            if (
                targetPage < 1
            ) {
                return;
            }

            if (
                totalPages > 0 &&
                targetPage >
                totalPages
            ) {
                return;
            }


            setExpandedLogId(
                null
            );


            await getAuditLogs(
                buildParams(
                    appliedFilters,
                    targetPage
                )
            );
        };


    const firstItemNumber =
        totalCount === 0
            ? 0
            : (pageNumber - 1) *
            pageSize +
            1;


    const lastItemNumber =
        Math.min(
            pageNumber *
            pageSize,
            totalCount
        );


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Administración
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Auditoría
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Consulta las
                    operaciones
                    registradas por el
                    sistema y quién
                    realizó cada cambio.
                </p>
            </div>


            {(formError ||
                error) && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {formError ||
                            error}
                    </div>
                )}


            {/* Filtros */}

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-start gap-3 border-b border-slate-100 pb-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 7h16M4 17h16" />
                            <circle cx="9" cy="7" r="3" fill="currentColor" stroke="none" />
                            <circle cx="15" cy="17" r="3" fill="currentColor" stroke="none" />
                        </svg>
                    </span>
                    <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        Filtros
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Puedes combinar
                        varios filtros o
                        dejarlos vacíos
                        para consultar
                        todos los eventos.
                    </p>
                    </div>
                </div>


                <form
                    onSubmit={
                        handleSearch
                    }
                    className="mt-6"
                >
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5 [&>div]:min-w-0">
                        <div>
                            <label htmlFor="audit-entity" className="block text-sm font-medium text-slate-700">
                                Entidad
                            </label>

                            <input
                                type="text"
                                id="audit-entity"
                                value={
                                    entityName
                                }
                                onChange={(
                                    event
                                ) =>
                                    setEntityName(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                maxLength={
                                    100
                                }
                                placeholder="Ej. InventoryAdjustment"
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>


                        <div>
                            <label htmlFor="audit-user" className="block text-sm font-medium text-slate-700">
                                ID usuario
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                id="audit-user"
                                value={
                                    performedByUserId
                                }
                                onChange={(
                                    event
                                ) =>
                                    setPerformedByUserId(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Ej. 1"
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>


                        <div>
                            <label htmlFor="audit-from" className="block text-sm font-medium text-slate-700">
                                Desde
                            </label>

                            <input
                                type="date"
                                id="audit-from"
                                value={
                                    dateFrom
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDateFrom(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>


                        <div>
                            <label htmlFor="audit-to" className="block text-sm font-medium text-slate-700">
                                Hasta
                            </label>

                            <input
                                type="date"
                                id="audit-to"
                                value={
                                    dateTo
                                }
                                onChange={(
                                    event
                                ) =>
                                    setDateTo(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>


                        <div>
                            <label htmlFor="audit-size" className="block text-sm font-medium text-slate-700">
                                Por página
                            </label>

                            <select
                                id="audit-size"
                                value={
                                    selectedPageSize
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSelectedPageSize(
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            >
                                <option
                                    value={
                                        10
                                    }
                                >
                                    10
                                </option>

                                <option
                                    value={
                                        25
                                    }
                                >
                                    25
                                </option>

                                <option
                                    value={
                                        50
                                    }
                                >
                                    50
                                </option>

                                <option
                                    value={
                                        100
                                    }
                                >
                                    100
                                </option>
                            </select>
                        </div>
                    </div>


                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() =>
                                void handleClear()
                            }
                            disabled={
                                loading
                            }
                            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        >
                            Limpiar
                        </button>

                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="min-h-11 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        >
                            {loading
                                ? "Consultando..."
                                : "Aplicar filtros"}
                        </button>
                    </div>
                </form>
            </section>


            {/* Resultados */}

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 bg-slate-50/70 p-6 sm:px-8">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Eventos
                                registrados
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {totalCount ===
                                    0
                                    ? "No hay registros."
                                    : `Mostrando ${firstItemNumber}-${lastItemNumber} de ${totalCount}.`}
                            </p>
                        </div>

                        {totalPages >
                            0 && (
                                <p className="text-sm text-slate-500">
                                    Página{" "}
                                    {
                                        pageNumber
                                    }{" "}
                                    de{" "}
                                    {
                                        totalPages
                                    }
                                </p>
                            )}
                    </div>
                </div>


                {loading &&
                    auditLogs.length ===
                    0 && (
                        <div role="status" className="flex flex-col items-center gap-4 px-6 py-14 text-center text-sm text-slate-600">
                            <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-sky-100 border-t-sky-600 motion-reduce:animate-none" />
                            Cargando
                            auditoría...
                        </div>
                    )}


                {!loading &&
                    auditLogs.length ===
                    0 && (
                        <div role="status" className="px-6 py-14 text-center">
                            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                    <path d="m16 16 4 4" />
                                </svg>
                            </span>
                            <p className="text-sm font-medium text-slate-700">
                                No se
                                encontraron
                                eventos.
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Prueba
                                cambiando los
                                filtros.
                            </p>
                        </div>
                    )}


                {auditLogs.length >
                    0 && (
                        <div className="space-y-4 bg-slate-50/50 p-4 sm:p-6">
                            {auditLogs.map(
                                (
                                    log
                                ) => {
                                    const expanded =
                                        expandedLogId ===
                                        log.id;

                                    const oldValues =
                                        formatJson(
                                            log.oldValuesJson
                                        );

                                    const newValues =
                                        formatJson(
                                            log.newValuesJson
                                        );

                                    const hasDetail =
                                        Boolean(
                                            oldValues ||
                                            newValues
                                        );


                                    return (
                                        <article
                                            key={
                                                log.id
                                            }
                                            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-200 motion-reduce:transition-none sm:p-6"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="max-w-full wrap-anywhere rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 ring-1 ring-inset ring-sky-200">
                                                            {
                                                                log.entityName
                                                            }
                                                        </span>

                                                        <span className="wrap-anywhere font-mono text-xs text-slate-500">
                                                            ID{" "}
                                                            {
                                                                log.entityId
                                                            }
                                                        </span>
                                                    </div>


                                                    <h3 className="mt-4 wrap-anywhere text-base font-semibold tracking-tight text-slate-900">
                                                        {
                                                            log.action
                                                        }
                                                    </h3>


                                                    {log.description && (
                                                        <p className="mt-2 wrap-anywhere text-sm leading-6 text-slate-600">
                                                            {
                                                                log.description
                                                            }
                                                        </p>
                                                    )}


                                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-600 [&>span]:min-w-0 [&>span]:wrap-anywhere">
                                                        <span>
                                                            {
                                                                log.performedByEmployeeName
                                                            }
                                                        </span>

                                                        <span>
                                                            Usuario:{" "}
                                                            {
                                                                log.performedByUsername
                                                            }
                                                        </span>

                                                        <span>
                                                            ID usuario:{" "}
                                                            {
                                                                log.performedByUserId
                                                            }
                                                        </span>

                                                        <span>
                                                            {formatDateTime(
                                                                log.createdAt
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>


                                                {hasDetail && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedLogId(
                                                                expanded
                                                                    ? null
                                                                    : log.id
                                                            )
                                                        }
                                                        aria-expanded={expanded}
                                                        className="min-h-11 w-full shrink-0 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none lg:w-auto"
                                                    >
                                                        {expanded
                                                            ? "Ocultar detalle"
                                                            : "Ver detalle"}
                                                    </button>
                                                )}
                                            </div>


                                            {expanded &&
                                                hasDetail && (
                                                    <div className="mt-6 grid min-w-0 gap-5 border-t border-slate-100 pt-6 xl:grid-cols-2">
                                                        <div className="min-w-0">
                                                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                                Valores
                                                                anteriores
                                                            </p>

                                                            {oldValues ? (
                                                                <pre tabIndex={0} className="max-h-96 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:p-5">
                                                                    {
                                                                        oldValues
                                                                    }
                                                                </pre>
                                                            ) : (
                                                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                                                                    Sin
                                                                    valores
                                                                    anteriores.
                                                                </div>
                                                            )}
                                                        </div>


                                                        <div className="min-w-0">
                                                            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                                                                Valores
                                                                nuevos
                                                            </p>

                                                            {newValues ? (
                                                                <pre tabIndex={0} className="max-h-96 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 sm:p-5">
                                                                    {
                                                                        newValues
                                                                    }
                                                                </pre>
                                                            ) : (
                                                                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                                                                    Sin
                                                                    valores
                                                                    nuevos.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}


                {/* Paginación */}

                {totalCount > 0 && (
                    <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                        <p className="text-sm text-slate-500">
                            {
                                totalCount
                            }{" "}
                            evento
                            {totalCount ===
                                1
                                ? ""
                                : "s"}{" "}
                            en total
                        </p>


                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <button
                                type="button"
                                onClick={() =>
                                    void goToPage(
                                        pageNumber -
                                        1
                                    )
                                }
                                disabled={
                                    loading ||
                                    !hasPreviousPage
                                }
                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                                Anterior
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void goToPage(
                                        pageNumber +
                                        1
                                    )
                                }
                                disabled={
                                    loading ||
                                    !hasNextPage
                                }
                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
