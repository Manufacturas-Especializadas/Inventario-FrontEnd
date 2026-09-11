import {
    useState,
    type FormEvent,
} from "react";

import {
    useInventoryAdjustments,
} from "../hooks/useInventoryAdjustments";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";


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

        loading,
        creating,

        error,

        getByFolio,
        createAdjustment,
        clearAdjustment,
    } = useInventoryAdjustments();


    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
    } = useWarehouses();


    const {
        products,
        loading: loadingProducts,
        error: productsError,
    } = usePPEProducts();


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


    const catalogError =
        warehousesError ||
        productsError;


    const loadingCatalogs =
        loadingWarehouses ||
        loadingProducts;


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

            clearAdjustment();

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
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Administración
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Ajustes de inventario
                </h1>

                <p className="mt-3 max-w-2xl wrap-break-word text-sm leading-6 text-slate-600">
                    Registra correcciones
                    manuales de inventario
                    debidamente justificadas.
                </p>
            </div>


            {catalogError && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {catalogError}
                </div>
            )}


            {(formError || error) && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    {formError ||
                        error}
                </div>
            )}


            {successMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                    {
                        successMessage
                    }
                </div>
            )}


            <form
                onSubmit={
                    handleReview
                }
                className="space-y-6"
            >
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
                                    setWarehouseId(
                                        event
                                            .target
                                            .value
                                    );

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
                                                                        product.id
                                                                    )
                                                                )
                                                        )
                                                        .map(
                                                            (
                                                                product
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        product.id
                                                                    }
                                                                    value={
                                                                        product.id
                                                                    }
                                                                >
                                                                    {
                                                                        product.sku
                                                                    }
                                                                    {
                                                                        " — "
                                                                    }
                                                                    {
                                                                        product.name
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


            {/* Confirmación */}

            {confirmationOpen && (
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
                                                    product.id ===
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
                                                        {product?.name ??
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


            {/* Resultado / consulta */}

            {adjustment && (
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                            Resultado
                        </p>

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

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
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
        </div>
    );
};
