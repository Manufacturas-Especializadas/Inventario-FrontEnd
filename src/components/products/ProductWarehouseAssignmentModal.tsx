import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    warehouseProductsService,
} from "../../api/services/WarehouseProductsService";

import type {
    BulkAssignWarehouseProductsResult,
    PPEProduct,
    Warehouse,
} from "../../types/types";

import {
    getApiErrorMessage,
} from "../../utils/utils";

interface ProductWarehouseAssignmentModalProps {
    open: boolean;

    products: PPEProduct[];
    selectedProductIds: Set<number>;

    warehouses: Warehouse[];
    loadingWarehouses: boolean;
    warehousesError: string | null;
    warehousesLoaded: boolean;

    loadWarehouses: () => Promise<void>;

    onClose: () => void;

    onAssigned: (
        result: BulkAssignWarehouseProductsResult
    ) => void;
}

export const ProductWarehouseAssignmentModal = ({
    open,
    products,
    selectedProductIds,
    warehouses,
    loadingWarehouses,
    warehousesError,
    warehousesLoaded,
    loadWarehouses,
    onClose,
    onAssigned,
}: ProductWarehouseAssignmentModalProps) => {
    const [
        search,
        setSearch,
    ] = useState("");

    const [
        selectedWarehouseIds,
        setSelectedWarehouseIds,
    ] = useState<Set<number>>(
        () => new Set()
    );

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(null);

    const selectAllRef =
        useRef<HTMLInputElement>(null);

    const closeButtonRef =
        useRef<HTMLButtonElement>(null);

    const selectedProducts =
        useMemo(
            () =>
                products.filter(
                    (product) =>
                        product.isActive &&
                        selectedProductIds.has(
                            product.id
                        )
                ),
            [
                products,
                selectedProductIds,
            ]
        );

    const activeWarehouses =
        useMemo(
            () =>
                warehouses
                    .filter(
                        (warehouse) =>
                            warehouse.isActive
                    )
                    .sort(
                        (first, second) =>
                            first.name.localeCompare(
                                second.name,
                                "es"
                            )
                    ),
            [warehouses]
        );

    const filteredWarehouses =
        useMemo(() => {
            const normalized =
                search
                    .trim()
                    .toLocaleLowerCase("es");

            if (!normalized) {
                return activeWarehouses;
            }

            return activeWarehouses.filter(
                (warehouse) =>
                    warehouse.code
                        .toLocaleLowerCase("es")
                        .includes(normalized) ||
                    warehouse.name
                        .toLocaleLowerCase("es")
                        .includes(normalized)
            );
        }, [
            activeWarehouses,
            search,
        ]);

    const visibleWarehouseIds =
        useMemo(
            () =>
                filteredWarehouses.map(
                    (warehouse) =>
                        warehouse.id
                ),
            [filteredWarehouses]
        );

    const selectedVisibleCount =
        useMemo(
            () =>
                visibleWarehouseIds.filter(
                    (id) =>
                        selectedWarehouseIds.has(
                            id
                        )
                ).length,
            [
                visibleWarehouseIds,
                selectedWarehouseIds,
            ]
        );

    const allVisibleSelected =
        visibleWarehouseIds.length > 0 &&
        selectedVisibleCount ===
        visibleWarehouseIds.length;

    const someVisibleSelected =
        selectedVisibleCount > 0 &&
        !allVisibleSelected;

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate =
                someVisibleSelected;
        }
    }, [
        someVisibleSelected,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSearch("");
        setSelectedWarehouseIds(
            new Set()
        );
        setActionError(null);

        closeButtonRef.current?.focus();

        if (!warehousesLoaded) {
            void loadWarehouses();
        }
    }, [
        open,
        warehousesLoaded,
        loadWarehouses,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape" &&
                !submitting
            ) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [
        open,
        submitting,
        onClose,
    ]);

    const toggleWarehouse = (
        warehouseId: number,
        selected: boolean
    ) => {
        setSelectedWarehouseIds(
            (current) => {
                const next =
                    new Set(current);

                if (selected) {
                    next.add(
                        warehouseId
                    );
                } else {
                    next.delete(
                        warehouseId
                    );
                }

                return next;
            }
        );

        setActionError(null);
    };

    const setVisibleSelection = (
        selected: boolean
    ) => {
        setSelectedWarehouseIds(
            (current) => {
                const next =
                    new Set(current);

                for (
                    const warehouseId
                    of visibleWarehouseIds
                ) {
                    if (selected) {
                        next.add(
                            warehouseId
                        );
                    } else {
                        next.delete(
                            warehouseId
                        );
                    }
                }

                return next;
            }
        );
    };

    const handleSubmit =
        async () => {
            if (
                submitting ||
                selectedProducts.length === 0 ||
                selectedWarehouseIds.size === 0
            ) {
                return;
            }

            setSubmitting(true);
            setActionError(null);

            try {
                const result =
                    await warehouseProductsService
                        .bulkAssign({
                            warehouseIds:
                                Array.from(
                                    selectedWarehouseIds
                                ),

                            ppeProductIds:
                                selectedProducts.map(
                                    (product) =>
                                        product.id
                                ),
                        });

                onAssigned(result);
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        "No fue posible asignar los productos a los almacenes."
                    )
                );
            } finally {
                setSubmitting(false);
            }
        };

    if (!open) {
        return null;
    }

    const totalAssignments =
        selectedProducts.length *
        selectedWarehouseIds.size;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-warehouse-assignment-title"
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">
                            Inventario
                        </p>

                        <h2
                            id="product-warehouse-assignment-title"
                            className="mt-1 text-xl font-semibold text-slate-900"
                        >
                            Asignar a almacenes
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            {selectedProducts.length === 1
                                ? `${selectedProducts[0].sku} · ${selectedProducts[0].name}`
                                : `${selectedProducts.length} productos seleccionados`}
                        </p>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Cerrar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    {loadingWarehouses && (
                        <div
                            role="status"
                            className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-8 text-center text-sm text-sky-800"
                        >
                            Cargando almacenes...
                        </div>
                    )}

                    {!loadingWarehouses &&
                        warehousesError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700"
                            >
                                <p>
                                    {
                                        warehousesError
                                    }
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        void loadWarehouses()
                                    }
                                    className="mt-3 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold hover:bg-red-100"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                    {!loadingWarehouses &&
                        !warehousesError &&
                        warehousesLoaded && (
                            <>
                                <div>
                                    <label
                                        htmlFor="warehouse-assignment-search"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Buscar almacén
                                    </label>

                                    <input
                                        id="warehouse-assignment-search"
                                        type="search"
                                        value={search}
                                        onChange={(
                                            event
                                        ) =>
                                            setSearch(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="Código o nombre"
                                        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100"
                                    />
                                </div>

                                {activeWarehouses.length ===
                                    0 ? (
                                    <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-5 py-8 text-center text-sm text-amber-800">
                                        No hay
                                        almacenes
                                        activos
                                        disponibles.
                                    </div>
                                ) : (
                                    <>
                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                                            <label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                                                <input
                                                    ref={
                                                        selectAllRef
                                                    }
                                                    type="checkbox"
                                                    checked={
                                                        allVisibleSelected
                                                    }
                                                    disabled={
                                                        visibleWarehouseIds.length ===
                                                        0
                                                    }
                                                    onChange={() =>
                                                        setVisibleSelection(
                                                            !allVisibleSelected
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                                                />

                                                Seleccionar
                                                visibles
                                            </label>

                                            <span className="text-sm font-medium text-slate-500">
                                                {
                                                    selectedWarehouseIds.size
                                                }{" "}
                                                seleccionado(s)
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            {filteredWarehouses.map(
                                                (
                                                    warehouse
                                                ) => (
                                                    <label
                                                        key={
                                                            warehouse.id
                                                        }
                                                        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-sky-300 hover:bg-sky-50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedWarehouseIds.has(
                                                                warehouse.id
                                                            )}
                                                            onChange={(
                                                                event
                                                            ) =>
                                                                toggleWarehouse(
                                                                    warehouse.id,
                                                                    event
                                                                        .target
                                                                        .checked
                                                                )
                                                            }
                                                            className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                                                        />

                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    warehouse.name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 font-mono text-xs text-slate-500">
                                                                {
                                                                    warehouse.code
                                                                }
                                                            </p>
                                                        </div>
                                                    </label>
                                                )
                                            )}
                                        </div>

                                        {filteredWarehouses.length ===
                                            0 && (
                                                <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
                                                    No
                                                    encontramos
                                                    almacenes
                                                    con esa
                                                    búsqueda.
                                                </p>
                                            )}
                                    </>
                                )}
                            </>
                        )}

                    {actionError && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {actionError}
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-5">
                    <div className="mb-4 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">
                            {
                                selectedProducts.length
                            }
                        </span>{" "}
                        producto(s) ×{" "}
                        <span className="font-semibold text-slate-900">
                            {
                                selectedWarehouseIds.size
                            }
                        </span>{" "}
                        almacén(es) ={" "}
                        <span className="font-semibold text-sky-800">
                            {
                                totalAssignments
                            }{" "}
                            asignaciones
                        </span>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                void handleSubmit()
                            }
                            disabled={
                                submitting ||
                                loadingWarehouses ||
                                selectedProducts.length ===
                                0 ||
                                selectedWarehouseIds.size ===
                                0
                            }
                            className="min-h-11 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors enabled:hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting
                                ? "Asignando..."
                                : "Asignar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};