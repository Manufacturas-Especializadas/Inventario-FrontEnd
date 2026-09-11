import {
    useState,
    useEffect,
} from "react";

import {
    useInventoryCounts,
} from "../hooks/useInventoryCounts";

import {
    useWarehouses,
} from "../hooks/useWarehouses";
import {
    useAuth,
} from "../hooks/useAuth";


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


const getStatusConfig = (
    status: number
) => {
    switch (status) {
        case 1:
            return {
                label: "En captura",
                className:
                    "bg-blue-50 text-blue-700",
            };

        case 2:
            return {
                label: "Pendiente de revisión",
                className:
                    "bg-amber-50 text-amber-700",
            };

        case 3:
            return {
                label: "Publicado",
                className:
                    "bg-emerald-50 text-emerald-700",
            };

        case 4:
            return {
                label: "Cancelado",
                className:
                    "bg-red-50 text-red-700",
            };

        default:
            return {
                label: "Desconocido",
                className:
                    "bg-slate-100 text-slate-600",
            };
    }
};


export const InventoryCountsPage = () => {
    const {
        inventoryCount,
        pendingReviewCounts,

        loading,
        loadingPendingReview,
        savingProductId,
        submitting,
        postingFolio,

        error,
        reviewError,

        getByFolio,
        getPendingReview,

        startCount,
        captureItem,
        submitCount,
        postCount,

        clearCount,
    } = useInventoryCounts();

    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole(
            "Administrator"
        );

    const [
        reviewSuccessMessage,
        setReviewSuccessMessage,
    ] = useState<string | null>(
        null
    );

    useEffect(() => {
        if (!isAdministrator) {
            return;
        }

        void getPendingReview();
    }, [
        isAdministrator,
        getPendingReview,
    ]);


    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
    } = useWarehouses();


    const [
        warehouseId,
        setWarehouseId,
    ] = useState("");

    const [
        notes,
        setNotes,
    ] = useState("");

    const [
        searchFolio,
        setSearchFolio,
    ] = useState("");

    const [
        countedValues,
        setCountedValues,
    ] = useState<
        Record<number, string>
    >({});

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null
    );


    const loadValues = (
        items: {
            ppeProductId: number;
            countedQuantity:
            number | null;
        }[]
    ) => {
        const values:
            Record<number, string> =
            {};

        for (const item of items) {
            values[
                item.ppeProductId
            ] =
                item.countedQuantity !==
                    null
                    ? String(
                        item.countedQuantity
                    )
                    : "";
        }

        setCountedValues(
            values
        );
    };


    const handleStartCount =
        async () => {
            const parsedWarehouseId =
                Number(
                    warehouseId
                );

            if (
                !Number.isInteger(
                    parsedWarehouseId
                ) ||
                parsedWarehouseId <= 0
            ) {
                return;
            }

            setSuccessMessage(
                null
            );

            const result =
                await startCount({
                    warehouseId:
                        parsedWarehouseId,

                    notes:
                        notes.trim() ||
                        null,
                });

            if (!result) {
                return;
            }

            loadValues(
                result.items
            );

            setSuccessMessage(
                `Conteo ${result.folio} iniciado correctamente.`
            );
        };


    const handleSearchCount =
        async () => {
            setSuccessMessage(
                null
            );

            const result =
                await getByFolio(
                    searchFolio
                );

            if (!result) {
                return;
            }

            loadValues(
                result.items
            );
        };


    const handleSaveItem =
        async (
            ppeProductId: number
        ) => {
            const value =
                countedValues[
                ppeProductId
                ];

            if (
                value === undefined ||
                value.trim() === ""
            ) {
                return;
            }

            const parsedQuantity =
                Number(value);

            const result =
                await captureItem(
                    inventoryCount!.folio,
                    ppeProductId,
                    parsedQuantity
                );

            if (!result) {
                return;
            }

            setCountedValues(
                (current) => ({
                    ...current,

                    [ppeProductId]:
                        String(
                            result.countedQuantity ??
                            ""
                        ),
                })
            );
        };


    const handleSubmitCount =
        async () => {
            if (!inventoryCount) {
                return;
            }

            setSuccessMessage(
                null
            );

            const result =
                await submitCount(
                    inventoryCount.folio
                );

            if (!result) {
                return;
            }

            loadValues(
                result.items
            );

            setSuccessMessage(
                `Conteo ${result.folio} enviado a revisión correctamente.`
            );
        };


    const handleCloseCount =
        () => {
            clearCount();

            setWarehouseId("");
            setNotes("");
            setSearchFolio("");

            setCountedValues(
                {}
            );

            setSuccessMessage(
                null
            );
        };


    const countedItems =
        inventoryCount?.items.filter(
            (item) =>
                item.countedQuantity !==
                null
        ).length ?? 0;


    const totalItems =
        inventoryCount?.items.length ??
        0;


    const allItemsCounted =
        totalItems > 0 &&
        countedItems === totalItems;


    const status =
        inventoryCount
            ? getStatusConfig(
                inventoryCount.status
            )
            : null;


    const handlePostCount =
        async (
            folio: string
        ) => {
            const confirmed =
                window.confirm(
                    `¿Publicar el conteo ${folio}? Las diferencias modificarán el inventario del almacén.`
                );

            if (!confirmed) {
                return;
            }

            setReviewSuccessMessage(
                null
            );

            const result =
                await postCount(
                    folio
                );

            if (!result) {
                return;
            }

            setReviewSuccessMessage(
                `Conteo ${result.folio} publicado correctamente. El inventario fue ajustado.`
            );
        };


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                    MESA · Almacén
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Conteos físicos
                </h1>

                <p className="mt-3 max-w-2xl wrap-break-word text-sm leading-6 text-slate-600">
                    Realiza conteos físicos
                    sin consultar previamente las
                    existencias registradas en el
                    sistema.
                </p>
            </div>


            {(error ||
                warehousesError) && (
                    <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {error ||
                            warehousesError}
                    </div>
                )}


            {successMessage && (
                <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                    {
                        successMessage
                    }
                </div>
            )}


            {!inventoryCount && (
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                    {/* Nuevo conteo */}

                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <div className="border-b border-slate-100 pb-5">
                            <span aria-hidden="true" className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="4" width="14" height="17" rx="2" />
                                    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
                                </svg>
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                                Nuevo conteo
                            </p>

                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                Iniciar conteo físico
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                El sistema agregará
                                automáticamente todos
                                los productos
                                activos al conteo.
                            </p>
                        </div>


                        <div className="mt-6 grid gap-6 rounded-xl border border-sky-100 bg-sky-50/40 p-4 md:grid-cols-2 sm:p-5">
                            <div>
                                <label htmlFor="count-warehouse" className="block text-sm font-medium text-slate-700">
                                    Almacén
                                </label>

                                <select
                                    id="count-warehouse"
                                    value={
                                        warehouseId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setWarehouseId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        loadingWarehouses ||
                                        loading
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        Selecciona un
                                        almacén
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


                            <div>
                                <label htmlFor="count-notes" className="block text-sm font-medium text-slate-700">
                                    Notas
                                </label>

                                <input
                                    id="count-notes"
                                    type="text"
                                    value={
                                        notes
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setNotes(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    placeholder="Opcional"
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>
                        </div>


                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                            <button
                                type="button"
                                onClick={() =>
                                    void handleStartCount()
                                }
                                disabled={
                                    loading ||
                                    !warehouseId
                                }
                                className="min-h-11 w-full shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {loading
                                    ? "Iniciando..."
                                    : "Iniciar conteo"}
                            </button>
                        </div>
                    </section>


                    {/* Recuperar conteo */}

                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <div className="border-b border-slate-100 pb-5">
                            <span aria-hidden="true" className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                    <path d="m16 16 4 4" />
                                </svg>
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                                Continuar
                            </p>

                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                Abrir conteo por
                                folio
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Recupera un conteo
                                existente para
                                continuar trabajando
                                con él o consultar su
                                estado.
                            </p>
                        </div>


                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1 space-y-2">
                                <label htmlFor="count-folio" className="block text-sm font-medium text-slate-700">
                                    Folio del conteo
                                </label>
                                <input
                                    id="count-folio"
                                    type="text"
                                    value={
                                        searchFolio
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchFolio(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        loading
                                    }
                                    placeholder="Folio del conteo"
                                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleSearchCount()
                                }
                                disabled={
                                    loading ||
                                    !searchFolio.trim()
                                }
                                className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                            >
                                {loading
                                    ? "Buscando..."
                                    : "Abrir"}
                            </button>
                        </div>
                    </section>
                </div>
            )}


            {inventoryCount && status && (
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Detalle del conteo</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="break-all font-mono text-xl font-semibold tracking-tight text-slate-900">
                                    {
                                        inventoryCount.folio
                                    }
                                </h2>

                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-current/15 ${status.className}`}
                                >
                                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                                    {
                                        status.label
                                    }
                                </span>
                            </div>

                            <p className="mt-2 text-sm font-medium text-slate-700">
                                {
                                    inventoryCount.warehouseCode
                                }
                                {" — "}
                                {
                                    inventoryCount.warehouseName
                                }
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Creado{" "}
                                {formatDateTime(
                                    inventoryCount.createdAt
                                )}
                            </p>

                            {inventoryCount.notes && (
                                <p className="mt-3 max-w-2xl wrap-break-word text-sm leading-6 text-slate-600">
                                    Notas:{" "}
                                    {
                                        inventoryCount.notes
                                    }
                                </p>
                            )}
                        </div>


                        <button
                            type="button"
                            onClick={
                                handleCloseCount
                            }
                            disabled={
                                savingProductId !==
                                null ||
                                submitting
                            }
                            className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                        >
                            Cerrar vista
                        </button>
                    </div>


                    {inventoryCount.status ===
                        1 && (
                            <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
                                <p className="text-sm font-semibold text-sky-900">
                                    Conteo ciego
                                </p>

                                <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-800">
                                    Captura únicamente la
                                    cantidad física que
                                    encuentres. Las
                                    existencias del sistema
                                    y las diferencias se
                                    mostrarán después de
                                    enviar el conteo a
                                    revisión.
                                </p>
                            </div>
                        )}


                    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-slate-700">
                            Productos capturados:{" "}
                            {countedItems} de{" "}
                            {totalItems}
                        </p>

                        {inventoryCount.status ===
                            1 && (
                                <p className="text-xs text-slate-500">
                                    Todos los productos
                                    deben tener una
                                    cantidad, incluso si
                                    es 0.
                                </p>
                            )}
                    </div>


                    <div className="mt-5 space-y-4">
                        {inventoryCount.items.map(
                            (item) => {
                                const saved =
                                    item.countedQuantity !==
                                    null;

                                return (
                                    <div
                                        key={
                                            item.id
                                        }
                                        className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-4 transition-colors hover:border-sky-200 motion-reduce:transition-none sm:p-5"
                                    >
                                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-end [&>div]:min-w-0">
                                            <div>
                                                <p className="wrap-break-word text-sm font-semibold text-slate-900">
                                                    {
                                                        item.productName
                                                    }
                                                </p>

                                                <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-500">
                                                    {
                                                        item.sku
                                                    }
                                                    {" · "}
                                                    {
                                                        item.categoryName
                                                    }
                                                </p>
                                            </div>


                                            {inventoryCount.status ===
                                                1 ? (
                                                <div>
                                                    <label htmlFor={`count-quantity-${item.id}`} className="block text-xs font-medium text-slate-600">
                                                        Cantidad
                                                        física
                                                    </label>

                                                    <input
                                                        id={`count-quantity-${item.id}`}
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                            countedValues[
                                                            item
                                                                .ppeProductId
                                                            ] ??
                                                            ""
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            setCountedValues(
                                                                (
                                                                    current
                                                                ) => ({
                                                                    ...current,

                                                                    [item.ppeProductId]:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        disabled={
                                                            savingProductId ===
                                                            item.ppeProductId
                                                        }
                                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-xs text-slate-500">
                                                        Cantidad
                                                        contada
                                                    </p>

                                                    <p className="mt-1 text-base font-semibold tabular-nums text-slate-900">
                                                        {
                                                            item.countedQuantity
                                                        }
                                                    </p>
                                                </div>
                                            )}


                                            {inventoryCount.status ===
                                                1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleSaveItem(
                                                                item.ppeProductId
                                                            )
                                                        }
                                                        disabled={
                                                            savingProductId ===
                                                            item.ppeProductId ||
                                                            (
                                                                countedValues[
                                                                item
                                                                    .ppeProductId
                                                                ] ??
                                                                ""
                                                            ).trim() ===
                                                            ""
                                                        }
                                                        className="min-h-11 w-full shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                                    >
                                                        {savingProductId ===
                                                            item.ppeProductId
                                                            ? "Guardando..."
                                                            : saved
                                                                ? "Actualizar"
                                                                : "Guardar"}
                                                    </button>
                                                )}
                                        </div>


                                        {saved &&
                                            inventoryCount.status ===
                                            1 && (
                                                <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                                                    Cantidad
                                                    guardada
                                                </p>
                                            )}


                                        {inventoryCount.status !==
                                            1 && (
                                                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-200 pt-5 text-center sm:grid-cols-3 [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:p-3">
                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Físico
                                                        </p>

                                                        <p className="mt-2 text-base font-semibold tabular-nums text-slate-800">
                                                            {
                                                                item.countedQuantity
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Sistema
                                                        </p>

                                                        <p className="mt-2 text-base font-semibold tabular-nums text-slate-800">
                                                            {item.systemQuantity ??
                                                                "—"}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Variación
                                                        </p>

                                                        <p className="mt-2 text-base font-semibold tabular-nums text-slate-800">
                                                            {item.variance ??
                                                                "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                );
                            }
                        )}
                    </div>


                    {inventoryCount.status ===
                        1 && (
                            <div className="mt-6 border-t border-slate-200 pt-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            Enviar a revisión
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Una vez enviado,
                                            el conteo ya no
                                            podrá modificarse
                                            desde Almacén.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleSubmitCount()
                                        }
                                        disabled={
                                            !allItemsCounted ||
                                            submitting ||
                                            savingProductId !==
                                            null
                                        }
                                        className="min-h-11 w-full shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                    >
                                        {submitting
                                            ? "Enviando..."
                                            : "Enviar a revisión"}
                                    </button>
                                </div>


                                {!allItemsCounted && (
                                    <p className="mt-3 text-sm text-amber-700">
                                        Faltan{" "}
                                        {totalItems -
                                            countedItems}{" "}
                                        producto(s) por
                                        guardar.
                                    </p>
                                )}
                            </div>
                        )}


                    {inventoryCount.status ===
                        2 && (
                            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
                                <p className="text-sm font-semibold text-amber-800">
                                    Conteo enviado a
                                    revisión
                                </p>

                                <p className="mt-2 text-sm leading-6 text-amber-800">
                                    El conteo ya no puede
                                    modificarse desde
                                    Almacén. Un
                                    administrador debe
                                    revisar las
                                    diferencias y
                                    publicarlo.
                                </p>

                                {inventoryCount.submittedAt && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        Enviado{" "}
                                        {formatDateTime(
                                            inventoryCount.submittedAt
                                        )}
                                    </p>
                                )}
                            </div>
                        )}
                </section>
            )}

            {isAdministrator && (
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                                Administración
                            </p>

                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                Conteos pendientes de revisión
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Revisa las diferencias entre
                                el conteo físico y la
                                existencia registrada antes
                                de publicar el ajuste.
                            </p>
                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                void getPendingReview()
                            }
                            disabled={
                                loadingPendingReview
                            }
                            className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                        >
                            {loadingPendingReview
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>
                    </div>


                    {reviewSuccessMessage && (
                        <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                            {
                                reviewSuccessMessage
                            }
                        </div>
                    )}


                    {reviewError && (
                        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            {
                                reviewError
                            }
                        </div>
                    )}


                    {loadingPendingReview &&
                        pendingReviewCounts.length ===
                        0 && (
                            <div role="status" className="mt-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-10 text-center">
                                <span aria-hidden="true" className="mx-auto mb-4 block h-7 w-7 rounded-full border-2 border-sky-200 border-t-sky-700 motion-safe:animate-spin" />
                                <p className="text-sm font-medium text-sky-800">
                                    Cargando conteos
                                    pendientes de revisión...
                                </p>
                            </div>
                        )}


                    {!loadingPendingReview &&
                        !reviewError &&
                        pendingReviewCounts.length ===
                        0 && (
                            <div className="mt-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                                <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="4" width="14" height="17" rx="2" />
                                    <path d="M9 4V3h6v1m-6 9 2 2 4-4" />
                                </svg>
                                <p className="text-sm font-medium text-slate-700">
                                    No hay conteos pendientes
                                    de revisión.
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Los conteos enviados por
                                    Almacén aparecerán aquí.
                                </p>
                            </div>
                        )}


                    {pendingReviewCounts.length >
                        0 && (
                            <div className="mt-6 space-y-5">
                                {pendingReviewCounts.map(
                                    (count) => {
                                        const hasVariance =
                                            count.items.some(
                                                (item) =>
                                                    item.variance !==
                                                    null &&
                                                    item.variance !==
                                                    0
                                            );

                                        return (
                                            <article
                                                key={
                                                    count.id
                                                }
                                                className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-4 sm:p-6"
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="break-all font-mono text-base font-semibold text-slate-900">
                                                                {
                                                                    count.folio
                                                                }
                                                            </h3>

                                                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                                                                Pendiente de revisión
                                                            </span>

                                                            <span
                                                                className={
                                                                    hasVariance
                                                                        ? "inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200"
                                                                        : "inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                                                }
                                                            >
                                                                {hasVariance
                                                                    ? "Con diferencias"
                                                                    : "Sin diferencias"}
                                                            </span>
                                                        </div>


                                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                                            {
                                                                count.warehouseCode
                                                            }
                                                            {" — "}
                                                            {
                                                                count.warehouseName
                                                            }
                                                        </p>


                                                        {count.submittedAt && (
                                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                                Enviado{" "}
                                                                {formatDateTime(
                                                                    count.submittedAt
                                                                )}
                                                            </p>
                                                        )}


                                                        {count.notes && (
                                                            <p className="mt-3 max-w-2xl wrap-break-word text-sm leading-6 text-slate-600">
                                                                Notas:{" "}
                                                                {
                                                                    count.notes
                                                                }
                                                            </p>
                                                        )}
                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handlePostCount(
                                                                count.folio
                                                            )
                                                        }
                                                        disabled={
                                                            postingFolio ===
                                                            count.folio
                                                        }
                                                        className="min-h-11 w-full shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                                    >
                                                        {postingFolio ===
                                                            count.folio
                                                            ? "Publicando..."
                                                            : "Publicar ajuste"}
                                                    </button>
                                                </div>


                                                <div tabIndex={0} role="region" aria-label={`Productos del conteo ${count.folio}`} className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100">
                                                    <table className="w-full min-w-160 text-left text-sm">
                                                        <thead>
                                                            <tr className="border-b border-sky-100 bg-sky-50/80 text-left text-xs font-semibold uppercase tracking-wider text-sky-800">
                                                                <th scope="col" className="px-5 py-4">
                                                                    Producto
                                                                </th>

                                                                <th scope="col" className="px-5 py-4 text-right">
                                                                    Sistema
                                                                </th>

                                                                <th scope="col" className="px-5 py-4 text-right">
                                                                    Físico
                                                                </th>

                                                                <th scope="col" className="px-5 py-4 text-right">
                                                                    Variación
                                                                </th>
                                                            </tr>
                                                        </thead>


                                                        <tbody className="divide-y divide-slate-100">
                                                            {count.items.map(
                                                                (
                                                                    item
                                                                ) => {
                                                                    const variance =
                                                                        item.variance;

                                                                    const varianceClass =
                                                                        variance ===
                                                                            null
                                                                            ? "text-slate-500"
                                                                            : variance ===
                                                                                0
                                                                                ? "text-emerald-700"
                                                                                : variance <
                                                                                    0
                                                                                    ? "text-red-700"
                                                                                    : "text-amber-700";

                                                                    return (
                                                                        <tr
                                                                            className="transition-colors hover:bg-sky-50/50 motion-reduce:transition-none"
                                                                            key={
                                                                                item.id
                                                                            }
                                                                        >
                                                                            <td className="px-5 py-4">
                                                                                <p className="text-sm font-medium text-slate-800">
                                                                                    {
                                                                                        item.productName
                                                                                    }
                                                                                </p>

                                                                                <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-500">
                                                                                    {
                                                                                        item.sku
                                                                                    }
                                                                                    {" · "}
                                                                                    {
                                                                                        item.categoryName
                                                                                    }
                                                                                </p>
                                                                            </td>


                                                                            <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-slate-700">
                                                                                {item.systemQuantity ??
                                                                                    "—"}
                                                                            </td>


                                                                            <td className="px-5 py-4 text-right text-sm font-medium tabular-nums text-slate-700">
                                                                                {item.countedQuantity ??
                                                                                    "—"}
                                                                            </td>


                                                                            <td
                                                                                className={`px-5 py-4 text-right text-sm font-semibold tabular-nums ${varianceClass}`}
                                                                            >
                                                                                {variance ===
                                                                                    null
                                                                                    ? "—"
                                                                                    : variance >
                                                                                        0
                                                                                        ? `+${variance}`
                                                                                        : variance}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                }
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>


                                                {hasVariance && (
                                                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
                                                        <p className="text-sm font-semibold text-amber-800">
                                                            Este conteo
                                                            modificará el
                                                            inventario.
                                                        </p>

                                                        <p className="mt-2 text-sm leading-6 text-amber-800">
                                                            Al publicar,
                                                            las variaciones
                                                            serán aplicadas
                                                            al inventario
                                                            actual del
                                                            almacén.
                                                        </p>
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        )}
                </section>
            )}
        </div>
    );
};
