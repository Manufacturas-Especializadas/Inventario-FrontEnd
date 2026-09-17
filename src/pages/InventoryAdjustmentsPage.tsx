import {
    useState,
    useRef,
    type FormEvent,
} from "react";

import {
    useInventoryAdjustments,
} from "../hooks/useInventoryAdjustments";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import { warehouseProductsService } from "../api/services/WarehouseProductsService";
import type { WarehouseProduct, InventoryAdjustmentFilters } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";
import { PageHeader } from "../components/ui/PageHeader";

import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";


interface AdjustmentFormItem {
    key: string;
    ppeProductId: string;
    quantityAdjustment: string;
}


const createEmptyItem =
    (): AdjustmentFormItem => ({
        key: crypto.randomUUID(),
        ppeProductId: "",
        quantityAdjustment: "",
    });


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


const formatSignedQuantity = (
    value: number
) => {
    return value > 0
        ? `+${value}`
        : String(value);
};


export const InventoryAdjustmentsPage = () => {
    const {
        adjustment,

        loadingDetail: loading,
        creating,

        detailError,
        createError,
        adjustments, hasLoadedList, loadingList, listError, getAdjustments, clearList,

        getByFolio,
        createAdjustment,
        clearAdjustment,
    } = useInventoryAdjustments();


    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
        hasLoaded: warehousesLoaded,
        refresh: loadWarehouses,
    } = useWarehouses({ autoLoad: false });
    const [showForm, setShowForm] = useState(false);
    const [showLookup, setShowLookup] = useState(false);
    const [historyScope, setHistoryScope] = useState<"all" | "warehouse">("all");
    const [historyFilters, setHistoryFilters] = useState<InventoryAdjustmentFilters>({});
    const warehouseRequest = useRef<Promise<void> | null>(null);
    const productRequests = useRef(new Map<number, Promise<void>>());
    const [productsByWarehouse, setProductsByWarehouse] = useState<Record<number, WarehouseProduct[]>>({});
    const [productErrors, setProductErrors] = useState<Record<number, string | null>>({});
    const [loadingProductsByWarehouse, setLoadingProductsByWarehouse] = useState<Record<number, boolean>>({});

    const loadFormCatalogs = () => {
        if (warehousesLoaded) return Promise.resolve();
        if (warehouseRequest.current) return warehouseRequest.current;
        const request = loadWarehouses().finally(() => { warehouseRequest.current = null; });
        warehouseRequest.current = request;
        return request;
    };

    // Read-only cache keyed by warehouse; late responses cannot replace another warehouse's options.
    const loadWarehouseProducts = (id: number) => {
        if (!id || productsByWarehouse[id]) return Promise.resolve();
        const pending = productRequests.current.get(id);
        if (pending) return pending;
        setLoadingProductsByWarehouse((current) => ({ ...current, [id]: true }));
        setProductErrors((current) => ({ ...current, [id]: null }));
        const request = warehouseProductsService.getByWarehouse(id).then((data) => {
            setProductsByWarehouse((current) => ({ ...current, [id]: data }));
        }).catch((error) => {
            setProductErrors((current) => ({ ...current, [id]: getApiErrorMessage(error, "No fue posible cargar los productos del almacén.") }));
        }).finally(() => {
            productRequests.current.delete(id);
            setLoadingProductsByWarehouse((current) => ({ ...current, [id]: false }));
        });
        productRequests.current.set(id, request);
        return request;
    };

    const changeHistoryFilters = (filters: InventoryAdjustmentFilters) => {
        setHistoryFilters(filters);
        clearList();
    };
    const invalidDates = Boolean(historyFilters.dateFrom && historyFilters.dateTo && historyFilters.dateFrom > historyFilters.dateTo);
    const queryHistory = () => {
        if (invalidDates || (historyScope === "warehouse" && !historyFilters.warehouseId)) return;
        void getAdjustments(historyFilters);
    };

    const toggleForm = () => {
        if (!showForm) void loadFormCatalogs();
        setShowForm(!showForm);
    };


    const [
        warehouseId,
        setWarehouseId,
    ] = useState("");

    const [
        reason,
        setReason,
    ] = useState("");

    const [
        items,
        setItems,
    ] = useState<
        AdjustmentFormItem[]
    >([
        createEmptyItem(),
    ]);

    const [
        formError,
        setFormError,
    ] = useState<string | null>(
        null
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null
    );

    const [
        confirmationOpen,
        setConfirmationOpen,
    ] = useState(false);

    const [
        searchFolio,
        setSearchFolio,
    ] = useState("");


    const products = (productsByWarehouse[Number(warehouseId)] ?? []).filter((product) => product.isActive);
    const loadingProducts = loadingProductsByWarehouse[Number(warehouseId)] ?? false;
    const productsError = productErrors[Number(warehouseId)];
    const catalogError = warehousesError;


    const loadingCatalogs =
        loadingWarehouses;

    const catalogsReady = warehousesLoaded;


    const resetForm = () => {
        setWarehouseId("");
        setReason("");

        setItems([
            createEmptyItem(),
        ]);

        setConfirmationOpen(
            false
        );

        setFormError(
            null
        );
    };


    const addItem = () => {
        setItems(
            (current) => [
                ...current,
                createEmptyItem(),
            ]
        );

        setConfirmationOpen(
            false
        );
    };


    const removeItem = (
        key: string
    ) => {
        setItems(
            (current) => {
                if (
                    current.length === 1
                ) {
                    return current;
                }

                return current.filter(
                    (item) =>
                        item.key !== key
                );
            }
        );

        setConfirmationOpen(
            false
        );
    };


    const updateItem = (
        key: string,
        field:
            | "ppeProductId"
            | "quantityAdjustment",
        value: string
    ) => {
        setItems(
            (current) =>
                current.map(
                    (item) =>
                        item.key === key
                            ? {
                                ...item,
                                [field]:
                                    value,
                            }
                            : item
                )
        );

        setConfirmationOpen(
            false
        );
    };


    const validateForm = () => {
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
            setFormError(
                "Selecciona un almacén."
            );

            return null;
        }


        const normalizedReason =
            reason.trim();

        if (!normalizedReason) {
            setFormError(
                "El motivo del ajuste es obligatorio."
            );

            return null;
        }

        if (
            normalizedReason.length >
            500
        ) {
            setFormError(
                "El motivo no puede superar los 500 caracteres."
            );

            return null;
        }


        if (loadingProducts || !productsByWarehouse[parsedWarehouseId]) {
            setFormError("Espera a que se carguen los productos del almacén.");
            return null;
        }
        if (!items.length || items.some((item) => !products.some((product) => product.ppeProductId === Number(item.ppeProductId)))) {
            setFormError("Selecciona productos activos configurados para este almacén.");
            return null;
        }

        const parsedItems =
            items.map(
                (item) => ({
                    ppeProductId:
                        Number(
                            item.ppeProductId
                        ),

                    quantityAdjustment:
                        Number(
                            item.quantityAdjustment
                        ),
                })
            );


        if (
            parsedItems.some(
                (item) =>
                    !Number.isInteger(
                        item.ppeProductId
                    ) ||
                    item.ppeProductId <=
                    0
            )
        ) {
            setFormError(
                "Selecciona un producto EPP en todos los renglones."
            );

            return null;
        }


        if (
            parsedItems.some(
                (item) =>
                    !Number.isInteger(
                        item.quantityAdjustment
                    ) ||
                    item.quantityAdjustment ===
                    0
            )
        ) {
            setFormError(
                "Cada ajuste debe ser un número entero distinto de cero."
            );

            return null;
        }


        const productIds =
            parsedItems.map(
                (item) =>
                    item.ppeProductId
            );

        if (
            new Set(productIds).size !==
            productIds.length
        ) {
            setFormError(
                "No puedes agregar el mismo producto EPP más de una vez."
            );

            return null;
        }


        return {
            warehouseId:
                parsedWarehouseId,

            reason:
                normalizedReason,

            items:
                parsedItems,
        };
    };


    const handleReview = (
        event:
            FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setFormError(
            null
        );

        setSuccessMessage(
            null
        );

        const request =
            validateForm();

        if (!request) {
            return;
        }

        setConfirmationOpen(
            true
        );
    };


    const handleConfirm =
        async () => {
            if (!confirmationOpen || creating) return;
            const request =
                validateForm();

            if (!request) {
                setConfirmationOpen(
                    false
                );

                return;
            }

            setSuccessMessage(
                null
            );

            const result =
                await createAdjustment(
                    request
                );

            if (!result) {
                return;
            }

            setSuccessMessage(
                `Ajuste ${result.folio} aplicado correctamente.`
            );

            resetForm();
        };


    const handleSearch =
        async () => {
            setFormError(
                null
            );

            setSuccessMessage(
                null
            );

            await getByFolio(
                searchFolio
            );
        };


    const selectedWarehouse =
        warehouses.find(
            (warehouse) =>
                warehouse.id ===
                Number(
                    warehouseId
                )
        );


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader eyebrow="MESA · Administración" title="Ajustes de inventario" description="Consulta ajustes y registra correcciones manuales de inventario debidamente justificadas." />

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    type="button"
                    onClick={toggleForm}
                    aria-expanded={showForm}
                    aria-controls="new-inventory-adjustment"
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none"
                >
                    {showForm ? "Ocultar formulario" : "Nuevo ajuste"}
                </button>
                <button
                    type="button"
                    onClick={() => setShowLookup(!showLookup)}
                    aria-expanded={showLookup}
                    aria-controls="inventory-adjustment-lookup"
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                >
                    {showLookup ? "Ocultar consulta" : "Consultar ajuste"}
                </button>
            </div>




            <section aria-label="Historial de ajustes" aria-busy={loadingList} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-lg font-semibold text-slate-900">Historial de ajustes</h2>
                <fieldset className="my-5 flex flex-wrap gap-3">
                    <legend className="sr-only">Alcance del historial</legend>
                    {([["all", "Todos los almacenes"], ["warehouse", "Almacén específico"]] as const).map(([value, label]) => (
                        <label key={value} className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                            <input type="radio" name="adjustment-history-scope" value={value} checked={historyScope === value} onChange={() => {
                                if (value === historyScope) return;
                                setHistoryScope(value);
                                changeHistoryFilters({ ...historyFilters, warehouseId: undefined });
                                if (value === "warehouse") void loadFormCatalogs();
                            }} />{label}
                        </label>
                    ))}
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {historyScope === "warehouse" && <div>
                        <label htmlFor="history-warehouse" className="block text-sm font-medium">Almacén</label>
                        <select id="history-warehouse" value={historyFilters.warehouseId ?? ""} disabled={loadingWarehouses} onChange={(event) => changeHistoryFilters({ ...historyFilters, warehouseId: Number(event.target.value) || undefined })} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3">
                            <option value="">{loadingWarehouses ? "Cargando almacenes..." : "Selecciona un almacén"}</option>
                            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} — {warehouse.name}</option>)}
                        </select>
                    </div>}
                    {([["dateFrom", "Desde"], ["dateTo", "Hasta"]] as const).map(([field, label]) => <div key={field}>
                        <label htmlFor={"history-" + field} className="block text-sm font-medium">{label}</label>
                        <input id={"history-" + field} type="date" value={historyFilters[field] ?? ""} aria-invalid={invalidDates} onChange={(event) => changeHistoryFilters({ ...historyFilters, [field]: event.target.value || undefined })} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 px-3" />
                    </div>)}
                    <button type="button" onClick={queryHistory} disabled={loadingList || invalidDates || (historyScope === "warehouse" && !historyFilters.warehouseId)} className="min-h-11 self-end rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white focus-visible:ring-4 focus-visible:ring-sky-200 disabled:opacity-50">{loadingList ? "Consultando..." : hasLoadedList ? "Actualizar" : "Consultar"}</button>
                </div>
                {historyScope === "warehouse" && warehousesError && <div role="alert" className="mt-4 text-red-700">{warehousesError}<button type="button" disabled={loadingWarehouses} onClick={() => void loadFormCatalogs()} className="ml-3 min-h-11 underline">Reintentar almacenes</button></div>}
                {invalidDates && <p role="alert" className="mt-4 text-red-700">La fecha inicial no puede ser posterior a la fecha final.</p>}
                {listError && <p role="alert" className="mt-4 text-red-700">{listError}</p>}
                {loadingList && <CatalogLoadingSkeleton label="Consultando historial de ajustes" />}
                {!loadingList && !listError && !hasLoadedList && <p className="mt-6 rounded-xl border border-dashed border-sky-200 bg-sky-50 p-6 text-sm">Los ajustes todavía no se han consultado.</p>}
                {!loadingList && !listError && hasLoadedList && adjustments.length === 0 && <p className="mt-6 text-sm">No se encontraron ajustes para los filtros seleccionados.</p>}
                {hasLoadedList && adjustments.length > 0 && <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <caption className="sr-only">Ajustes para los filtros consultados</caption>
                        <thead className="bg-slate-50 text-slate-600"><tr>{["Folio", "Almacén", "Motivo", "Creado por", "Fecha", "Acciones"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead>
                        <tbody>{adjustments.map((entry) => <tr key={entry.id} className="border-t border-slate-100">
                            <td className="whitespace-nowrap px-4 py-3 font-mono">{entry.folio}</td>
                            <td className="px-4 py-3">{entry.warehouseCode} — {entry.warehouseName}</td>
                            <td className="min-w-48 max-w-sm break-words px-4 py-3">{entry.reason}</td>
                            <td className="px-4 py-3">{entry.createdByName}</td>
                            <td className="whitespace-nowrap px-4 py-3">{formatDateTime(entry.createdAt)}</td>
                            <td className="px-4 py-3"><button type="button" onClick={() => void getByFolio(entry.folio)} className="min-h-11 whitespace-nowrap rounded-xl border border-sky-200 px-4 text-sky-800 focus-visible:ring-4 focus-visible:ring-sky-100" aria-label={"Ver detalle " + entry.folio}>Ver detalle</button></td>
                        </tr>)}</tbody>
                    </table>
                </div>}
            </section>
            {loading && <CatalogLoadingSkeleton label="Cargando detalle del ajuste" />}
            {detailError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{detailError}</p>}

            {showForm && (formError || createError) && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {formError || createError}
                </div>
            )}


            {successMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                    {
                        successMessage
                    }
                </div>
            )}


            <div id="new-inventory-adjustment" hidden={!showForm} className="space-y-6">
                {showForm && !loadingCatalogs && catalogError && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        <p>{catalogError}</p>
                        <button
                            type="button"
                            onClick={() => void loadFormCatalogs()}
                            className="mt-4 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {showForm && loadingCatalogs && (
                    <CatalogLoadingSkeleton label="Cargando almacenes" />
                )}

                {showForm && catalogsReady && !loadingCatalogs && !catalogError && (
                    <form
                        onSubmit={
                            handleReview
                        }
                        className="space-y-6"
                    >
                        {warehouseId && loadingProducts && <CatalogLoadingSkeleton label="Cargando productos del almacén" />}
                        {productsError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{productsError}<button type="button" onClick={() => void loadWarehouseProducts(Number(warehouseId))} className="ml-3 min-h-11 underline">Reintentar productos</button></div>}
                        {warehouseId && productsByWarehouse[Number(warehouseId)] && products.length === 0 && <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 p-4">Este almacén no tiene productos EPP configurados.</p>}
                        {/* Datos generales */}

                        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">01</span>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                        Paso 1
                                    </p>

                                    <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                        Datos del ajuste
                                    </h2>
                                </div>
                            </div>


                            <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] [&>div]:min-w-0">
                                <div>
                                    <label htmlFor="adjustment-warehouse" className="block text-sm font-medium text-slate-700">
                                        Almacén
                                    </label>

                                    <select
                                        id="adjustment-warehouse"
                                        value={
                                            warehouseId
                                        }
                                        onChange={(
                                            event
                                        ) => {
                                            const value = event.target.value;
                                            setWarehouseId(value);
                                            setItems([createEmptyItem()]);
                                            setFormError(null);
                                            void loadWarehouseProducts(Number(value));

                                            setConfirmationOpen(
                                                false
                                            );
                                        }}
                                        disabled={
                                            loadingWarehouses ||
                                            creating
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
                                    <label htmlFor="adjustment-reason" className="block text-sm font-medium text-slate-700">
                                        Motivo
                                    </label>

                                    <textarea
                                        id="adjustment-reason"
                                        aria-describedby="adjustment-reason-length"
                                        value={
                                            reason
                                        }
                                        onChange={(
                                            event
                                        ) => {
                                            setReason(
                                                event
                                                    .target
                                                    .value
                                            );

                                            setConfirmationOpen(
                                                false
                                            );
                                        }}
                                        maxLength={
                                            500
                                        }
                                        rows={4}
                                        disabled={
                                            creating
                                        }
                                        placeholder="Explica por qué se requiere modificar manualmente el inventario..."
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    />

                                    <p id="adjustment-reason-length" className="mt-2 text-right text-xs tabular-nums text-slate-500">
                                        {reason.length}
                                        /500
                                    </p>
                                </div>
                            </div>
                        </section>


                        {/* Productos */}

                        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">02</span>
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                            Paso 2
                                        </p>

                                        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                            Productos a
                                            ajustar
                                        </h2>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            Usa cantidades
                                            positivas para
                                            aumentar y negativas
                                            para disminuir.
                                        </p>
                                    </div>
                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        addItem
                                    }
                                    disabled={
                                        loadingProducts ||
                                        creating
                                    }
                                    className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                                >
                                    Agregar producto
                                </button>
                            </div>


                            <div className="mt-6 space-y-4">
                                {items.map(
                                    (
                                        item,
                                        index
                                    ) => {
                                        const otherSelectedIds =
                                            items
                                                .filter(
                                                    (
                                                        current
                                                    ) =>
                                                        current.key !==
                                                        item.key
                                                )
                                                .map(
                                                    (
                                                        current
                                                    ) =>
                                                        current.ppeProductId
                                                )
                                                .filter(
                                                    Boolean
                                                );

                                        return (
                                            <div
                                                key={
                                                    item.key
                                                }
                                                className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-sky-50/70 to-white p-4 transition-colors hover:border-sky-200 motion-reduce:transition-none sm:p-5"
                                            >
                                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_200px_auto] lg:items-end [&>div]:min-w-0">
                                                    <div>
                                                        <label htmlFor={`adjustment-product-${item.key}`} className="block text-sm font-medium text-slate-700">
                                                            Producto
                                                        </label>

                                                        <select
                                                            id={`adjustment-product-${item.key}`}
                                                            value={
                                                                item.ppeProductId
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateItem(
                                                                    item.key,
                                                                    "ppeProductId",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                loadingProducts ||
                                                                creating
                                                            }
                                                            className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                                        >
                                                            <option value="">
                                                                Selecciona
                                                                un
                                                                producto
                                                            </option>

                                                            {products
                                                                .filter(
                                                                    (
                                                                        product
                                                                    ) =>
                                                                        product.isActive &&
                                                                        !otherSelectedIds.includes(
                                                                            String(
                                                                                product.ppeProductId
                                                                            )
                                                                        )
                                                                )
                                                                .map(
                                                                    (
                                                                        product
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                product.ppeProductId
                                                                            }
                                                                            value={
                                                                                product.ppeProductId
                                                                            }
                                                                        >
                                                                            {
                                                                                product.sku
                                                                            }
                                                                            {
                                                                                " — "
                                                                            }
                                                                            {
                                                                                product.productName
                                                                            }
                                                                        </option>
                                                                    )
                                                                )}
                                                        </select>
                                                    </div>


                                                    <div>
                                                        <label htmlFor={`adjustment-quantity-${item.key}`} className="block text-sm font-medium text-slate-700">
                                                            Ajuste
                                                        </label>

                                                        <input
                                                            id={`adjustment-quantity-${item.key}`}
                                                            type="number"
                                                            step="1"
                                                            value={
                                                                item.quantityAdjustment
                                                            }
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                updateItem(
                                                                    item.key,
                                                                    "quantityAdjustment",
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                creating
                                                            }
                                                            placeholder="Ej. 5 o -3"
                                                            className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                                        />
                                                    </div>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeItem(
                                                                item.key
                                                            )
                                                        }
                                                        disabled={
                                                            items.length ===
                                                            1 ||
                                                            creating
                                                        }
                                                        className="min-h-11 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 transition-colors enabled:hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                    >
                                                        Quitar
                                                    </button>
                                                </div>

                                                <p className="mt-4 inline-flex rounded-lg border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800">
                                                    Producto{" "}
                                                    {index +
                                                        1}
                                                </p>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </section>


                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    loadingCatalogs
                                }
                                className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                Revisar ajuste
                            </button>
                        </div>
                    </form>
                )}


                {/* Confirmación */}

                {showForm && confirmationOpen && (
                    <section className="rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 to-white p-6 shadow-sm sm:p-8">
                        <div className="border-b border-amber-200 pb-6">
                            <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-white text-amber-700">
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01" />
                                </svg>
                            </span>
                            <p className="text-sm font-semibold text-amber-800">
                                Confirmar ajuste
                            </p>

                            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                                Revisa antes de
                                modificar el
                                inventario
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-amber-900">
                                Esta operación
                                modificará las
                                existencias del
                                almacén inmediatamente.
                            </p>
                        </div>


                        <div className="mt-6 rounded-xl border border-amber-200 bg-white p-5 sm:p-6">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Almacén
                            </p>

                            <p className="mt-2 wrap-break-word text-sm font-semibold tabular-nums text-slate-800">
                                {selectedWarehouse
                                    ? `${selectedWarehouse.code} — ${selectedWarehouse.name}`
                                    : "—"}
                            </p>


                            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Motivo
                            </p>

                            <p className="mt-2 wrap-break-word text-sm leading-6 text-slate-700">
                                {
                                    reason
                                }
                            </p>


                            <div className="mt-5 border-t border-slate-100 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Ajustes
                                </p>

                                <div className="mt-3 space-y-2">
                                    {items.map(
                                        (
                                            item
                                        ) => {
                                            const product =
                                                products.find(
                                                    (
                                                        product
                                                    ) =>
                                                        product.ppeProductId ===
                                                        Number(
                                                            item.ppeProductId
                                                        )
                                                );

                                            const quantity =
                                                Number(
                                                    item.quantityAdjustment
                                                );

                                            return (
                                                <div
                                                    key={
                                                        item.key
                                                    }
                                                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-4 [&>div]:min-w-0"
                                                >
                                                    <div>
                                                        <p className="wrap-break-word text-sm font-medium text-slate-800">
                                                            {product?.productName ??
                                                                "Producto"}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {product?.sku ??
                                                                ""}
                                                        </p>
                                                    </div>

                                                    <p
                                                        className={`shrink-0 rounded-lg bg-white px-3 py-1.5 text-base font-semibold tabular-nums ring-1 ring-inset ring-current/15 ${quantity >
                                                            0
                                                            ? "text-emerald-700"
                                                            : "text-red-700"
                                                            }`}
                                                    >
                                                        {formatSignedQuantity(
                                                            quantity
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </div>
                        </div>


                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmationOpen(
                                        false
                                    )
                                }
                                disabled={
                                    creating
                                }
                                className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                            >
                                Volver
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleConfirm()
                                }
                                disabled={
                                    creating
                                }
                                className="min-h-11 w-full rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                            >
                                {creating
                                    ? "Aplicando ajuste..."
                                    : "Confirmar ajuste"}
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {/* Resultado / consulta */}

            {adjustment && (
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                            Resultado
                        </p>

                        <button type="button" onClick={clearAdjustment} className="float-right min-h-11 rounded-xl border border-slate-200 px-4 text-sm">Cerrar detalle</button>
                        <p className="mt-2 text-sm text-slate-600">Creado por: {adjustments.find((entry) => entry.folio === adjustment.folio)?.createdByName ?? ("Usuario #" + adjustment.createdByUserId)}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            <h2 className="break-all font-mono text-lg font-semibold tracking-tight text-slate-900">
                                {
                                    adjustment.folio
                                }
                            </h2>

                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                Aplicado
                            </span>
                        </div>

                        <p className="mt-3 max-w-2xl wrap-break-word text-sm leading-6 text-slate-600">
                            {
                                adjustment.warehouseCode
                            }
                            {" — "}
                            {
                                adjustment.warehouseName
                            }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            {formatDateTime(
                                adjustment.createdAt
                            )}
                        </p>

                        <p className="mt-4 wrap-break-word rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm leading-6 text-slate-700">
                            Motivo:{" "}
                            {
                                adjustment.reason
                            }
                        </p>
                    </div>


                    <div className="mt-6 space-y-3">
                        {adjustment.items.map(
                            (
                                item
                            ) => (
                                <div
                                    key={
                                        item.ppeProductId
                                    }
                                    className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-4 sm:p-5"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="wrap-break-word text-sm font-semibold text-slate-900">
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

                                        <p
                                            className={`shrink-0 self-start rounded-lg bg-white px-3 py-1.5 text-lg font-semibold tabular-nums ring-1 ring-inset ring-current/15 ${item.quantityAdjustment >
                                                0
                                                ? "text-emerald-700"
                                                : "text-red-700"
                                                }`}
                                        >
                                            {formatSignedQuantity(
                                                item.quantityAdjustment
                                            )}
                                        </p>
                                    </div>


                                    <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4 [&>div]:min-w-0 [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:p-3 [&>div:last-child]:border-sky-200 [&>div:last-child]:bg-sky-50">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Anterior
                                            </p>

                                            <p className="mt-2 wrap-break-word text-sm font-semibold tabular-nums text-slate-800">
                                                {
                                                    item.previousOnHandQuantity
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Nuevo
                                            </p>

                                            <p className="mt-2 wrap-break-word text-sm font-semibold tabular-nums text-slate-800">
                                                {
                                                    item.newOnHandQuantity
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Reservado
                                            </p>

                                            <p className="mt-2 wrap-break-word text-sm font-semibold tabular-nums text-slate-800">
                                                {
                                                    item.reservedQuantity
                                                }
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Disponible
                                            </p>

                                            <p className="mt-2 wrap-break-word text-sm font-semibold tabular-nums text-slate-800">
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


            {/* Buscar ajuste */}

            <div id="inventory-adjustment-lookup" hidden={!showLookup}>
                {showLookup && (
                    <section aria-busy={loading} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                    <path d="m16 16 4 4" />
                                </svg>
                            </span>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                    Consulta
                                </p>

                                <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                                    Buscar ajuste por
                                    folio
                                </h2>
                            </div>
                        </div>


                        <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1 space-y-2">
                                <label htmlFor="adjustment-folio" className="block text-sm font-medium text-slate-700">Folio del ajuste</label>
                                <input
                                    id="adjustment-folio"
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
                                    placeholder="Folio del ajuste"
                                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void handleSearch()
                                }
                                disabled={
                                    loading ||
                                    !searchFolio.trim()
                                }
                                className="min-h-11 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                            >
                                {loading
                                    ? "Buscando..."
                                    : "Buscar"}
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};
