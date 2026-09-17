import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    warehouseProductsService,
} from "../../api/services/WarehouseProductsService";

import {
    useAuth,
} from "../../hooks/useAuth";

import {
    usePPEProducts,
} from "../../hooks/usePPEProducts";

import { useWarehouseProducts } from "../../hooks/useWarehouseProducts.ts";

import type {
    Warehouse,
} from "../../types/types";

import {
    getApiErrorMessage,
} from "../../utils/utils";

import {
    ActiveStatusBadge,
} from "../ui/ActiveStatusBadge";


interface WarehouseProductsModalProps {
    warehouse: Warehouse | null;

    onClose: () => void;
}


export const WarehouseProductsModal = ({
    warehouse,
    onClose,
}: WarehouseProductsModalProps) => {
    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole("Administrator");


    const {
        products,
        loading: loadingProducts,
        hasLoaded: hasLoadedProducts,
        error: productsError,
        refresh: refreshProducts,
    } = usePPEProducts({
        autoLoad: false,
    });


    const {
        loadingWarehouseId,
        error: relationsError,

        getByWarehouse,
        refreshWarehouse,

        getCachedByWarehouse,
        hasLoadedWarehouse,

        upsertRelation,
        clearError,
    } = useWarehouseProducts();


    const [
        selectedProductId,
        setSelectedProductId,
    ] = useState("");


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const [
        changingStatusProductId,
        setChangingStatusProductId,
    ] = useState<number | null>(null);


    const [
        actionError,
        setActionError,
    ] = useState<string | null>(null);


    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null);


    /*
     * El componente permanece montado aun cuando
     * warehouse sea null.
     *
     * Eso permite conservar los caches de los hooks.
     */
    useEffect(() => {
        if (!warehouse) {
            return;
        }

        void getByWarehouse(
            warehouse.id
        );

        /*
         * El catálogo completo de productos solamente
         * lo necesita Administrator para asignar nuevos.
         */
        if (
            isAdministrator &&
            !hasLoadedProducts
        ) {
            void refreshProducts();
        }
    }, [
        warehouse,
        getByWarehouse,
        isAdministrator,
        hasLoadedProducts,
        refreshProducts,
    ]);


    /*
     * Limpiamos únicamente estado visual cuando
     * cambia el almacén.
     *
     * No eliminamos cache.
     */
    useEffect(() => {
        setSelectedProductId("");
        setSearch("");
        setActionError(null);
        setSuccessMessage(null);

        clearError();
    }, [
        warehouse?.id,
        clearError,
    ]);


    /*
     * Escape cierra el modal.
     */
    useEffect(() => {
        if (!warehouse) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
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
        warehouse,
        onClose,
    ]);


    const relations =
        warehouse
            ? getCachedByWarehouse(
                warehouse.id
            )
            : [];


    const hasLoadedRelations =
        warehouse
            ? hasLoadedWarehouse(
                warehouse.id
            )
            : false;


    const isLoadingRelations =
        warehouse !== null &&
        loadingWarehouseId ===
        warehouse.id;


    const assignedProductIds =
        useMemo(
            () =>
                new Set(
                    relations.map(
                        (relation) =>
                            relation.ppeProductId
                    )
                ),
            [relations]
        );


    /*
     * Solo productos:
     *
     * - activos globalmente
     * - que todavía NO tienen relación
     *
     * Si la relación existe pero está inactiva,
     * se reactiva desde la tabla; no se crea otra.
     */
    const availableProducts =
        useMemo(
            () =>
                products
                    .filter(
                        (product) =>
                            product.isActive &&
                            !assignedProductIds.has(
                                product.id
                            )
                    )
                    .sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name,
                                "es"
                            )
                    ),
            [
                products,
                assignedProductIds,
            ]
        );


    const filteredRelations =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLocaleLowerCase(
                        "es"
                    );

            return relations
                .filter(
                    (relation) =>
                        !normalizedSearch ||
                        relation.sku
                            .toLocaleLowerCase(
                                "es"
                            )
                            .includes(
                                normalizedSearch
                            ) ||
                        relation.productName
                            .toLocaleLowerCase(
                                "es"
                            )
                            .includes(
                                normalizedSearch
                            )
                )
                .sort((a, b) => {
                    if (
                        a.isActive !==
                        b.isActive
                    ) {
                        return a.isActive
                            ? -1
                            : 1;
                    }

                    return a.productName
                        .localeCompare(
                            b.productName,
                            "es"
                        );
                });
        }, [
            relations,
            search,
        ]);


    const handleAddProduct =
        async () => {
            if (
                !warehouse ||
                !selectedProductId
            ) {
                return;
            }

            setSubmitting(true);
            setActionError(null);
            setSuccessMessage(null);

            try {
                const created =
                    await warehouseProductsService
                        .create({
                            warehouseId:
                                warehouse.id,

                            ppeProductId:
                                Number(
                                    selectedProductId
                                ),
                        });

                upsertRelation(
                    created
                );

                setSelectedProductId("");

                setSuccessMessage(
                    `Producto "${created.productName}" agregado al almacén.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        "No fue posible agregar el producto al almacén."
                    )
                );
            } finally {
                setSubmitting(false);
            }
        };


    const handleStatusChange =
        async (
            ppeProductId: number,
            isActive: boolean
        ) => {
            if (!warehouse) {
                return;
            }

            setChangingStatusProductId(
                ppeProductId
            );

            setActionError(null);
            setSuccessMessage(null);

            try {
                const updated =
                    await warehouseProductsService
                        .setStatus(
                            warehouse.id,
                            ppeProductId,
                            {
                                isActive:
                                    !isActive,
                            }
                        );

                upsertRelation(
                    updated
                );

                setSuccessMessage(
                    updated.isActive
                        ? `Producto "${updated.productName}" activado en el almacén.`
                        : `Producto "${updated.productName}" desactivado del almacén.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cambiar el estado del producto."
                    )
                );
            } finally {
                setChangingStatusProductId(
                    null
                );
            }
        };


    if (!warehouse) {
        return null;
    }


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="warehouse-products-title"
                className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
                {/* HEADER */}
                <div className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 sm:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Productos por almacén
                        </p>

                        <h2
                            id="warehouse-products-title"
                            className="mt-2 text-xl font-semibold tracking-tight text-slate-950"
                        >
                            {warehouse.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {warehouse.code} · Administra qué productos EPP maneja este almacén.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                        aria-label="Cerrar"
                    >
                        <svg
                            aria-hidden="true"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        >
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </div>


                <div className="overflow-y-auto px-6 py-6 sm:px-8">
                    {/* AGREGAR PRODUCTO */}
                    {isAdministrator && (
                        <section className="rounded-2xl border border-sky-100 bg-sky-50/50 p-5">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Agregar producto
                                </h3>

                                <p className="mt-1 text-sm text-slate-600">
                                    Asigna un producto activo para que forme parte del inventario y los conteos de este almacén.
                                </p>
                            </div>

                            {!warehouse.isActive && (
                                <div
                                    role="alert"
                                    className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                                >
                                    El almacén está inactivo. No puedes agregar o reactivar productos hasta activarlo.
                                </div>
                            )}

                            {loadingProducts && (
                                <p className="mt-4 text-sm text-sky-800">
                                    Cargando catálogo de productos...
                                </p>
                            )}

                            {!loadingProducts &&
                                productsError && (
                                    <div
                                        role="alert"
                                        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                    >
                                        <span>
                                            {productsError}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void refreshProducts()
                                            }
                                            className="font-semibold underline underline-offset-2"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                )}

                            {!loadingProducts &&
                                !productsError &&
                                hasLoadedProducts && (
                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                        <select
                                            value={
                                                selectedProductId
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                setSelectedProductId(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                            disabled={
                                                submitting ||
                                                !warehouse.isActive ||
                                                availableProducts.length ===
                                                0
                                            }
                                            className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                        >
                                            <option value="">
                                                {availableProducts.length ===
                                                    0
                                                    ? "No hay productos disponibles para asignar"
                                                    : "Selecciona un producto"}
                                            </option>

                                            {availableProducts.map(
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
                                                        }{" "}
                                                        ·{" "}
                                                        {
                                                            product.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleAddProduct()
                                            }
                                            disabled={
                                                submitting ||
                                                !warehouse.isActive ||
                                                !selectedProductId
                                            }
                                            className="min-h-11 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {submitting
                                                ? "Agregando..."
                                                : "Agregar"}
                                        </button>
                                    </div>
                                )}
                        </section>
                    )}


                    {/* MENSAJES */}
                    {actionError && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {actionError}
                        </div>
                    )}

                    {successMessage && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                        >
                            {successMessage}
                        </div>
                    )}


                    {/* LISTADO */}
                    <section className="mt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Productos asignados
                                </h3>

                                {hasLoadedRelations &&
                                    !relationsError && (
                                        <p className="mt-1 text-sm text-slate-500">
                                            {
                                                relations.length
                                            }{" "}
                                            productos configurados
                                        </p>
                                    )}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    void refreshWarehouse(
                                        warehouse.id
                                    )
                                }
                                disabled={
                                    isLoadingRelations
                                }
                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Actualizar
                            </button>
                        </div>


                        {hasLoadedRelations &&
                            !relationsError &&
                            relations.length > 0 && (
                                <div className="mt-5">
                                    <label
                                        htmlFor="warehouse-product-search"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Buscar
                                    </label>

                                    <input
                                        id="warehouse-product-search"
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
                                        placeholder="SKU o nombre del producto"
                                        className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                    />
                                </div>
                            )}


                        {isLoadingRelations &&
                            !hasLoadedRelations && (
                                <div
                                    role="status"
                                    className="mt-5 rounded-xl border border-sky-100 bg-sky-50 px-5 py-8 text-center text-sm text-sky-800"
                                >
                                    Cargando productos del almacén...
                                </div>
                            )}


                        {!isLoadingRelations &&
                            relationsError && (
                                <div
                                    role="alert"
                                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                                >
                                    {relationsError}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void refreshWarehouse(
                                                warehouse.id
                                            )
                                        }
                                        className="ml-3 font-semibold underline underline-offset-2"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}


                        {!isLoadingRelations &&
                            hasLoadedRelations &&
                            !relationsError &&
                            relations.length ===
                            0 && (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                                    <p className="text-sm font-semibold text-slate-900">
                                        No hay productos asignados.
                                    </p>

                                    <p className="mt-2 text-sm text-slate-500">
                                        Este almacén todavía no tiene productos configurados.
                                    </p>
                                </div>
                            )}


                        {!isLoadingRelations &&
                            hasLoadedRelations &&
                            !relationsError &&
                            relations.length > 0 &&
                            filteredRelations.length ===
                            0 && (
                                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-600">
                                    No hay productos que coincidan con la búsqueda.
                                </div>
                            )}


                        {hasLoadedRelations &&
                            !relationsError &&
                            filteredRelations.length >
                            0 && (
                                <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                                    <table className="w-full min-w-180 text-left text-sm">
                                        <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                            <tr>
                                                <th className="px-5 py-3">
                                                    SKU
                                                </th>

                                                <th className="px-5 py-3">
                                                    Producto
                                                </th>

                                                <th className="px-5 py-3">
                                                    Estado
                                                </th>

                                                {isAdministrator && (
                                                    <th className="px-5 py-3 text-right">
                                                        Acción
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {filteredRelations.map(
                                                (
                                                    relation
                                                ) => (
                                                    <tr
                                                        key={
                                                            relation.ppeProductId
                                                        }
                                                        className="hover:bg-sky-50/40"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                                                            {
                                                                relation.sku
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 font-medium text-slate-900">
                                                            {
                                                                relation.productName
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <ActiveStatusBadge
                                                                isActive={
                                                                    relation.isActive
                                                                }
                                                            />
                                                        </td>

                                                        {isAdministrator && (
                                                            <td className="px-5 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        changingStatusProductId ===
                                                                        relation.ppeProductId ||
                                                                        (!warehouse.isActive &&
                                                                            !relation.isActive)
                                                                    }
                                                                    onClick={() =>
                                                                        void handleStatusChange(
                                                                            relation.ppeProductId,
                                                                            relation.isActive
                                                                        )
                                                                    }
                                                                    className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${relation.isActive
                                                                        ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                                                                        : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                                                                        }`}
                                                                >
                                                                    {changingStatusProductId ===
                                                                        relation.ppeProductId
                                                                        ? "Guardando..."
                                                                        : relation.isActive
                                                                            ? "Desactivar"
                                                                            : "Activar"}
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </section>
                </div>


                <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};