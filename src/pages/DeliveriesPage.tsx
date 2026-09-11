import {
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


export const DeliveriesPage = () => {
    const {
        pendingRequests,

        loadingPending,
        deliveringFolio,

        pendingError,
        deliverError,

        getPending,
        deliverRequest,
        clearDeliverError,
    } = usePPERequests();


    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
    } = useWarehouses();


    const [
        selectedWarehouseId,
        setSelectedWarehouseId,
    ] = useState("");

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


    const getWarehouseFilterId =
        (): number | null => {
            if (!selectedWarehouseId) {
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

        const parsedWarehouseId =
            value
                ? Number(value)
                : null;

        void getPending(
            parsedWarehouseId
        );
    };


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

            const normalizedEmployeeNumber =
                employeeNumber.trim();

            if (!normalizedEmployeeNumber) {
                return;
            }

            setDeliveryResult(null);

            const result =
                await deliverRequest(
                    folio,
                    normalizedEmployeeNumber,
                    getWarehouseFilterId()
                );

            if (!result) {
                return;
            }

            setDeliveryResult(
                result
            );

            setDeliveryFolio(
                null
            );

            setEmployeeNumber("");
        };


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Almacén
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Entregas de inventario
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Consulta solicitudes
                    pendientes y confirma la
                    entrega física de los artículos al
                    empleado correspondiente.
                </p>
            </div>


            {/* Filtro */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">01</span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Selecciona el almacén</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Consulta las entregas pendientes de un almacén o de todos.</p>
                    </div>
                </div>
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
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
                                Todos los almacenes
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


                    <button
                        type="button"
                        onClick={() =>
                            void getPending(
                                getWarehouseFilterId()
                            )
                        }
                        disabled={
                            loadingPending
                        }
                        className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                        {loadingPending
                            ? "Actualizando..."
                            : "Actualizar"}
                    </button>
                </div>


                {warehousesError && (
                    <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {
                            warehousesError
                        }
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

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">02</span>
                    <div>

                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Solicitudes por entregar
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                            Solo aparecen solicitudes
                            que todavía se encuentran
                            pendientes.
                        </p>
                    </div>
                </div>


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


                {!loadingPending &&
                    !pendingError &&
                    pendingRequests.length ===
                    0 && (
                        <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <p className="text-sm font-medium text-slate-700">
                                No hay solicitudes
                                pendientes.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                No hay artículos por entregar
                                con el filtro actual.
                            </p>
                        </div>
                    )}


                {pendingRequests.length >
                    0 && (
                        <div className="mt-6 space-y-4">
                            {pendingRequests.map(
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
                                                                    deliveringFolio ===
                                                                    request.folio
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
