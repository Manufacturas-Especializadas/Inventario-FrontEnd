import {
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from "react";

import {
    usePPERequests,
} from "../hooks/usePPERequests";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import type {
    DeliverPPERequestResult,
} from "../types/types";

import { PageHeader } from "../components/ui/PageHeader";


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

type PendingRequestsSort =
    | "newest"
    | "oldest"
    | "employee"
    | "unit";


const normalizeText = (
    value: string | null | undefined
) => {
    return (value ?? "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim()
        .toLocaleLowerCase("es");
};

export const DeliveriesPage = () => {
    const {
        pendingRequests,
        pendingHasLoaded,

        loadingPending,
        deliveringFolio,

        pendingError,
        deliverError,

        getPending,
        clearPending,
        deliverRequest,
        clearDeliverError,
    } = usePPERequests({ autoLoadPending: false });


    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
        hasLoaded: warehousesLoaded,
        refresh: loadWarehouses,
    } = useWarehouses({ autoLoad: false });


    const [
        selectedWarehouseId,
        setSelectedWarehouseId,
    ] = useState("");

    const [scope, setScope] = useState<"all" | "warehouse">("all");
    const warehouseLoadRequest = useRef<Promise<void> | null>(null);
    const deliveryInFlight = useRef(false);
    const warehouseSelectionVersion = useRef(0);

    const ensureWarehouses = () => {
        if (warehousesLoaded) return Promise.resolve();
        if (warehouseLoadRequest.current) return warehouseLoadRequest.current;
        const request = loadWarehouses().finally(() => { warehouseLoadRequest.current = null; });
        warehouseLoadRequest.current = request;
        return request;
    };

    const [
        pendingSearch,
        setPendingSearch,
    ] = useState("");

    const [
        destinationUnitFilter,
        setDestinationUnitFilter,
    ] = useState("");

    const [
        createdFrom,
        setCreatedFrom,
    ] = useState("");

    const [
        createdTo,
        setCreatedTo,
    ] = useState("");

    const [
        pendingSort,
        setPendingSort,
    ] =
        useState<PendingRequestsSort>(
            "newest"
        );

    const [
        deliveryFolio,
        setDeliveryFolio,
    ] = useState<string | null>(
        null
    );

    const [
        employeeNumber,
        setEmployeeNumber,
    ] = useState("");

    const [
        deliveryResult,
        setDeliveryResult,
    ] =
        useState<DeliverPPERequestResult | null>(
            null
        );
    const resetPendingFilters = () => {
        setPendingSearch("");
        setDestinationUnitFilter("");
        setCreatedFrom("");
        setCreatedTo("");
        setPendingSort("newest");
    };


    const destinationUnits =
        useMemo(() => {
            return Array.from(
                new Set(
                    pendingRequests
                        .map(
                            (request) =>
                                request
                                    .requestedForOrganizationalUnitName
                                    ?.trim()
                        )
                        .filter(
                            (
                                value
                            ): value is string =>
                                Boolean(value)
                        )
                )
            ).sort(
                (first, second) =>
                    first.localeCompare(
                        second,
                        "es",
                        {
                            sensitivity:
                                "base",
                        }
                    )
            );
        }, [pendingRequests]);


    const hasRequestsWithoutUnit =
        useMemo(
            () =>
                pendingRequests.some(
                    (request) =>
                        !request
                            .requestedForOrganizationalUnitName
                ),
            [pendingRequests]
        );


    const invalidDateRange =
        Boolean(
            createdFrom &&
            createdTo &&
            createdFrom > createdTo
        );


    const filteredPendingRequests =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(
                    pendingSearch
                );

            const fromTimestamp =
                createdFrom
                    ? new Date(
                        `${createdFrom}T00:00:00`
                    ).getTime()
                    : null;

            const toTimestamp =
                createdTo
                    ? new Date(
                        `${createdTo}T23:59:59.999`
                    ).getTime()
                    : null;

            if (invalidDateRange) {
                return [];
            }

            return pendingRequests
                .filter((request) => {
                    const matchesSearch =
                        !normalizedSearch ||
                        [
                            request.folio,
                            request.employeeNumber,
                            request.employeeName,
                            request
                                .requestedForOrganizationalUnitName,
                            request.requestReason,
                            request.warehouseName,
                        ].some((value) =>
                            normalizeText(
                                value
                            ).includes(
                                normalizedSearch
                            )
                        ) ||
                        request.items.some(
                            (item) =>
                                normalizeText(
                                    item.sku
                                ).includes(
                                    normalizedSearch
                                ) ||
                                normalizeText(
                                    item.productName
                                ).includes(
                                    normalizedSearch
                                )
                        );

                    const matchesUnit =
                        !destinationUnitFilter ||
                        (
                            destinationUnitFilter ===
                                "__without_unit__"
                                ? !request
                                    .requestedForOrganizationalUnitName
                                : request
                                    .requestedForOrganizationalUnitName ===
                                destinationUnitFilter
                        );

                    const createdAt =
                        new Date(
                            request.createdAt
                        ).getTime();

                    const matchesFrom =
                        fromTimestamp === null ||
                        createdAt >=
                        fromTimestamp;

                    const matchesTo =
                        toTimestamp === null ||
                        createdAt <=
                        toTimestamp;

                    return (
                        matchesSearch &&
                        matchesUnit &&
                        matchesFrom &&
                        matchesTo
                    );
                })
                .sort((first, second) => {
                    switch (pendingSort) {
                        case "oldest":
                            return (
                                new Date(
                                    first.createdAt
                                ).getTime() -
                                new Date(
                                    second.createdAt
                                ).getTime()
                            );

                        case "employee":
                            return first.employeeName
                                .localeCompare(
                                    second.employeeName,
                                    "es",
                                    {
                                        sensitivity:
                                            "base",
                                    }
                                );

                        case "unit":
                            return (
                                first
                                    .requestedForOrganizationalUnitName ??
                                "Sin unidad"
                            ).localeCompare(
                                second
                                    .requestedForOrganizationalUnitName ??
                                "Sin unidad",
                                "es",
                                {
                                    sensitivity:
                                        "base",
                                }
                            );

                        case "newest":
                        default:
                            return (
                                new Date(
                                    second.createdAt
                                ).getTime() -
                                new Date(
                                    first.createdAt
                                ).getTime()
                            );
                    }
                });
        }, [
            pendingRequests,
            pendingSearch,
            destinationUnitFilter,
            createdFrom,
            createdTo,
            pendingSort,
            invalidDateRange,
        ]);


    const hasActivePendingFilters =
        Boolean(
            pendingSearch.trim() ||
            destinationUnitFilter ||
            createdFrom ||
            createdTo ||
            pendingSort !== "newest"
        );

    const getWarehouseFilterId =
        (): number | null => {
            if (scope === "all" || !selectedWarehouseId) {
                return null;
            }

            const parsed =
                Number(
                    selectedWarehouseId
                );

            if (
                !Number.isInteger(parsed) ||
                parsed <= 0
            ) {
                return null;
            }

            return parsed;
        };


    const handleWarehouseChange = (
        value: string
    ) => {
        setSelectedWarehouseId(
            value
        );

        setDeliveryFolio(null);
        setEmployeeNumber("");
        clearDeliverError();
        setDeliveryResult(null);
        warehouseSelectionVersion.current += 1;
        clearPending();
        resetPendingFilters();
    };

    const handleScopeChange = (value: "all" | "warehouse") => {
        if (value === scope) return;
        setScope(value);
        handleWarehouseChange("");
        if (value === "warehouse") void ensureWarehouses();
    };

    const canQuery = scope === "all" || getWarehouseFilterId() !== null;
    const scopeLabel = scope === "all"
        ? "Todos los almacenes"
        : warehouses.find((warehouse) => warehouse.id === Number(selectedWarehouseId))?.name ?? "Selecciona un almacén";

    const openDelivery = (
        folio: string
    ) => {
        setDeliveryFolio(
            folio
        );

        setEmployeeNumber("");

        setDeliveryResult(null);

        clearDeliverError();
    };


    const closeDelivery = () => {
        setDeliveryFolio(null);

        setEmployeeNumber("");

        clearDeliverError();
    };


    const handleDelivery =
        async (
            event:
                FormEvent<HTMLFormElement>,
            folio: string
        ) => {
            event.preventDefault();
            if (deliveryInFlight.current) return;

            const normalizedEmployeeNumber =
                employeeNumber.trim();

            if (!normalizedEmployeeNumber) {
                return;
            }

            setDeliveryResult(null);
            const currentWarehouseVersion = warehouseSelectionVersion.current;

            deliveryInFlight.current = true;
            try {
                const result = await deliverRequest(
                    folio,
                    normalizedEmployeeNumber
                );

                if (currentWarehouseVersion !== warehouseSelectionVersion.current) {
                    clearDeliverError();
                    return;
                }
                if (!result) return;

                setDeliveryResult(result);
                setDeliveryFolio(null);
                setEmployeeNumber("");
            } finally {
                deliveryInFlight.current = false;
            }
        };


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                eyebrow="MESA · Almacén"
                title="Entregas de inventario"
                description="Consulta solicitudes pendientes y confirma la entrega física de los artículos al empleado correspondiente."
            />


            {/* Filtro */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">01</span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Alcance de consulta</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Consulta las entregas pendientes de un almacén o de todos.</p>
                    </div>
                </div>
                <fieldset className="mb-5 flex flex-wrap gap-3">
                    <legend className="sr-only">Alcance de consulta</legend>
                    {([
                        ["all", "Todos los almacenes"],
                        ["warehouse", "Un almacén específico"],
                    ] as const).map(([value, label]) => (
                        <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                            <input type="radio" name="delivery-scope" value={value} checked={scope === value} onChange={() => handleScopeChange(value)} className="h-4 w-4 accent-sky-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200" />
                            {label}
                        </label>
                    ))}
                </fieldset>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    {scope === "warehouse" && (
                    <div className="w-full max-w-md">
                        <label htmlFor="delivery-warehouse" className="block text-sm font-medium text-slate-700">
                            Almacén
                        </label>

                        <select
                            id="delivery-warehouse"
                            value={
                                selectedWarehouseId
                            }
                            onChange={(
                                event
                            ) =>
                                handleWarehouseChange(
                                    event.target
                                        .value
                                )
                            }
                            disabled={
                                loadingWarehouses
                            }
                            className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                        >
                            <option value="">
                                {loadingWarehouses ? "Cargando almacenes..." : "Selecciona un almacén"}
                            </option>

                            {warehouses
                                .filter(
                                    (
                                        warehouse
                                    ) =>
                                        warehouse.isActive
                                )
                                .map(
                                    (
                                        warehouse
                                    ) => (
                                        <option
                                            key={
                                                warehouse.id
                                            }
                                            value={
                                                warehouse.id
                                            }
                                        >
                                            {
                                                warehouse.code
                                            }
                                            {" — "}
                                            {
                                                warehouse.name
                                            }
                                        </option>
                                    )
                                )}
                        </select>
                    </div>
                    )}


                    <button
                        type="button"
                        onClick={() => {
                            if (!canQuery) return;
                            void getPending(
                                getWarehouseFilterId()
                            );
                        }}
                        disabled={
                            loadingPending || !canQuery
                        }
                        className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                        {loadingPending
                            ? "Consultando..."
                            : pendingHasLoaded
                                ? "Actualizar"
                                : "Consultar entregas"}
                    </button>
                </div>


                {scope === "warehouse" && warehousesError && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {
                            warehousesError
                        }
                        <button type="button" disabled={loadingWarehouses} onClick={() => void ensureWarehouses()} className="ml-3 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-50">Reintentar almacenes</button>
                    </p>
                )}
            </section>


            {/* Resultado de entrega */}

            {deliveryResult && (
                <section role="status" className="rounded-2xl border border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-6 shadow-sm sm:p-8">
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-emerald-100 p-2 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                    <p className="text-sm font-semibold text-emerald-800">
                        Entrega realizada
                        correctamente
                    </p>

                    <h2 className="mt-2 wrap-break-word font-mono text-xl font-bold text-emerald-900">
                        {
                            deliveryResult.folio
                        }
                    </h2>

                    <p className="mt-2 text-sm text-emerald-700">
                        {
                            deliveryResult.employeeNumber
                        }
                        {" — "}
                        {
                            deliveryResult.employeeName
                        }
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                        Almacén:{" "}
                        {
                            deliveryResult.warehouseName
                        }
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                        Entregado:{" "}
                        {formatDateTime(
                            deliveryResult.deliveredAt
                        )}
                    </p>


                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        {deliveryResult.items.map(
                            (item) => (
                                <div
                                    key={
                                        item.ppeProductId
                                    }
                                    className="min-w-0 wrap-break-word rounded-xl border border-emerald-200 bg-white p-5"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {
                                                    item.productName
                                                }
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                {
                                                    item.sku
                                                }
                                            </p>
                                        </div>

                                        <p className="text-sm font-semibold text-emerald-700">
                                            Entregado:{" "}
                                            {
                                                item.deliveredQuantity
                                            }
                                        </p>
                                    </div>


                                    <div className="mt-4 grid gap-3 rounded-xl bg-emerald-50/60 p-4 text-center tabular-nums sm:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Existencia
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {
                                                    item.onHandQuantity
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Reservado
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {
                                                    item.reservedQuantity
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Disponible
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {
                                                    item.availableQuantity
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </section>
            )}


            {/* Solicitudes */}
                <section aria-label="Solicitudes por entregar" aria-busy={loadingPending} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">02</span>
                        <div>

                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Solicitudes por entregar
                            </h2>
                            <p className="mt-2 text-sm font-medium text-sky-800">Alcance: {scopeLabel}</p>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Solo aparecen solicitudes
                                que todavía se encuentran
                                pendientes.
                            </p>
                        </div>
                    </div>

                    {pendingRequests.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-6">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.75fr)]">

                                {/* Búsqueda general */}

                                <div>
                                    <label
                                        htmlFor="pending-search"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Buscar
                                    </label>

                                    <input
                                        id="pending-search"
                                        type="search"
                                        value={
                                            pendingSearch
                                        }
                                        onChange={(event) =>
                                            setPendingSearch(
                                                event.target
                                                    .value
                                            )
                                        }
                                        placeholder="Folio, nómina, empleado, SKU o producto..."
                                        autoComplete="off"
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                                    />
                                </div>


                                {/* Unidad destino */}

                                <div>
                                    <label
                                        htmlFor="pending-unit"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Unidad destino
                                    </label>

                                    <select
                                        id="pending-unit"
                                        value={
                                            destinationUnitFilter
                                        }
                                        onChange={(event) =>
                                            setDestinationUnitFilter(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            Todas las unidades
                                        </option>

                                        {hasRequestsWithoutUnit && (
                                            <option value="__without_unit__">
                                                Sin unidad
                                            </option>
                                        )}

                                        {destinationUnits.map(
                                            (unit) => (
                                                <option
                                                    key={unit}
                                                    value={unit}
                                                >
                                                    {unit}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>


                                {/* Desde */}

                                <div>
                                    <label
                                        htmlFor="pending-from"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Desde
                                    </label>

                                    <input
                                        id="pending-from"
                                        type="date"
                                        value={
                                            createdFrom
                                        }
                                        max={
                                            createdTo ||
                                            undefined
                                        }
                                        onChange={(event) =>
                                            setCreatedFrom(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                                    />
                                </div>


                                {/* Hasta */}

                                <div>
                                    <label
                                        htmlFor="pending-to"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Hasta
                                    </label>

                                    <input
                                        id="pending-to"
                                        type="date"
                                        value={
                                            createdTo
                                        }
                                        min={
                                            createdFrom ||
                                            undefined
                                        }
                                        onChange={(event) =>
                                            setCreatedTo(
                                                event.target
                                                    .value
                                            )
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                                    />
                                </div>
                            </div>


                            {/* Segunda fila */}

                            <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                                <div className="w-full sm:max-w-xs">
                                    <label
                                        htmlFor="pending-sort"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Ordenar
                                    </label>

                                    <select
                                        id="pending-sort"
                                        value={
                                            pendingSort
                                        }
                                        onChange={(event) =>
                                            setPendingSort(
                                                event.target
                                                    .value as PendingRequestsSort
                                            )
                                        }
                                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition duration-200 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                                    >
                                        <option value="newest">
                                            Más recientes
                                        </option>

                                        <option value="oldest">
                                            Más antiguas
                                        </option>

                                        <option value="employee">
                                            Empleado A-Z
                                        </option>

                                        <option value="unit">
                                            Unidad A-Z
                                        </option>
                                    </select>
                                </div>


                                <div className="flex flex-col gap-3 sm:items-end">
                                    <p className="text-sm text-slate-500">
                                        Mostrando{" "}
                                        <span className="font-semibold text-slate-800">
                                            {
                                                filteredPendingRequests.length
                                            }
                                        </span>
                                        {" de "}
                                        {
                                            pendingRequests.length
                                        }
                                        {" solicitudes"}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            resetPendingFilters
                                        }
                                        disabled={
                                            !hasActivePendingFilters
                                        }
                                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            </div>


                            {invalidDateRange && (
                                <p
                                    role="alert"
                                    className="mt-4 text-sm font-medium text-red-600"
                                >
                                    La fecha inicial no puede ser posterior a la fecha final.
                                </p>
                            )}
                        </div>
                    )}

                    {!pendingHasLoaded && !loadingPending && !pendingError && (
                        <p className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-10 text-center text-sm text-slate-700">Las solicitudes pendientes todavía no se han consultado.</p>
                    )}
                    {pendingError && (
                        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {
                                pendingError
                            }
                        </div>
                    )}


                    {loadingPending &&
                        pendingRequests.length ===
                        0 && (
                            <div role="status" className="mt-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                                Cargando solicitudes
                                pendientes...
                            </div>
                        )}


                    {pendingHasLoaded && !loadingPending &&
                        !pendingError &&
                        pendingRequests.length ===
                        0 && (
                            <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                                <p className="text-sm font-medium text-slate-700">
                                    No hay solicitudes pendientes para entregar en este alcance.
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    No hay artículos por entregar
                                    con el filtro actual.
                                </p>
                            </div>
                        )}

                    {!loadingPending &&
                        !pendingError &&
                        pendingRequests.length > 0 &&
                        filteredPendingRequests.length === 0 &&
                        !invalidDateRange && (
                            <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                                <p className="text-sm font-semibold text-slate-700">
                                    No encontramos solicitudes
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    No hay solicitudes pendientes que coincidan con los filtros seleccionados.
                                </p>

                                <button
                                    type="button"
                                    onClick={
                                        resetPendingFilters
                                    }
                                    className="mt-5 min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        )}

                    {filteredPendingRequests.length >
                        0 && (
                            <div className="mt-6 space-y-4">
                                {filteredPendingRequests.map(
                                    (
                                        request
                                    ) => (
                                        <article
                                            key={
                                                request.id
                                            }
                                            className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm sm:p-6"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="wrap-break-word font-mono text-sm font-semibold text-sky-800">
                                                            {
                                                                request.folio
                                                            }
                                                        </h3>

                                                        <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                                                            Pendiente
                                                        </span>
                                                    </div>

                                                    <p className="mt-2 text-sm text-slate-500">
                                                        Creada{" "}
                                                        {formatDateTime(
                                                            request.createdAt
                                                        )}
                                                    </p>
                                                </div>


                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDelivery(
                                                            request.folio
                                                        )
                                                    }
                                                    disabled={
                                                        deliveringFolio ===
                                                        request.folio
                                                    }
                                                    className="min-h-11 rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
                                                >
                                                    Confirmar entrega
                                                </button>
                                            </div>


                                            <div className="mt-5 grid gap-5 rounded-xl bg-sky-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0 [&>div]:wrap-break-word">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                                        Empleado
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {
                                                            request.employeeName
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        Nómina{" "}
                                                        {
                                                            request.employeeNumber
                                                        }
                                                    </p>
                                                </div>


                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                                        Unidad destino
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {request.requestedForOrganizationalUnitName ??
                                                            "Sin unidad"}
                                                    </p>
                                                </div>


                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                                        Almacén
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {
                                                            request.warehouseName
                                                        }
                                                    </p>
                                                </div>


                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                                        Motivo
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-800">
                                                        {
                                                            request.requestReason
                                                        }
                                                    </p>
                                                </div>
                                            </div>


                                            <div className="mt-5 border-t border-slate-100 pt-5">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                                    Artículos a entregar
                                                </p>

                                                <div className="mt-3 space-y-2">
                                                    {request.items.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <div
                                                                key={
                                                                    item.ppeProductId
                                                                }
                                                                className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between [&>div]:min-w-0 [&>div]:wrap-break-word"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-800">
                                                                        {
                                                                            item.productName
                                                                        }
                                                                    </p>

                                                                    <p className="text-xs text-slate-500">
                                                                        {
                                                                            item.sku
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <p className="text-sm font-semibold text-slate-700">
                                                                    Cantidad:{" "}
                                                                    {
                                                                        item.quantity
                                                                    }
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>


                                            {deliveryFolio ===
                                                request.folio && (
                                                    <form
                                                        onSubmit={(
                                                            event
                                                        ) =>
                                                            void handleDelivery(
                                                                event,
                                                                request.folio
                                                            )
                                                        }
                                                        className="mt-5 border-t border-slate-200 pt-5"
                                                    >
                                                        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 sm:p-6">
                                                            <h4 className="text-sm font-semibold text-sky-900">
                                                                Verificar empleado
                                                            </h4>

                                                            <p className="mt-1 text-sm text-sky-800">
                                                                Captura o escanea el
                                                                número de empleado que
                                                                está recibiendo
                                                                físicamente los artículos.
                                                            </p>


                                                            <div className="mt-4 max-w-md">
                                                                <label htmlFor={`delivery-employee-${request.id}`} className="block text-sm font-medium text-slate-700">
                                                                    Número de empleado
                                                                </label>

                                                                <input
                                                                    id={`delivery-employee-${request.id}`}
                                                                    type="text"
                                                                    value={
                                                                        employeeNumber
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        setEmployeeNumber(
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    autoComplete="off"
                                                                    autoFocus
                                                                    disabled={
                                                                        deliveringFolio ===
                                                                        request.folio
                                                                    }
                                                                    placeholder="Escanea o captura la nómina"
                                                                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                                                                />
                                                            </div>


                                                            {deliverError && (
                                                                <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700">
                                                                    {
                                                                        deliverError
                                                                    }
                                                                </div>
                                                            )}


                                                            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        closeDelivery
                                                                    }
                                                                    disabled={
                                                                        deliveringFolio ===
                                                                        request.folio
                                                                    }
                                                                    className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                                >
                                                                    Volver
                                                                </button>

                                                                <button
                                                                    type="submit"
                                                                    disabled={
                                                                        !employeeNumber.trim() ||
                                                                        deliveringFolio !== null
                                                                    }
                                                                    className="min-h-11 rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none"
                                                                >
                                                                    {deliveringFolio ===
                                                                        request.folio
                                                                        ? "Entregando..."
                                                                        : "Entregar artículos"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                )}
                                        </article>
                                    )
                                )}
                            </div>
                        )}
                </section>
        </div>
    );
};
