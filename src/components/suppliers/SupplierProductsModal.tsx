import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    productSuppliersService,
} from "../../api/services/ProductSuppliersService";

import type {
    Supplier,
    ProductSupplier
} from "../../types/types";

import {
    getApiErrorMessage,
} from "../../utils/utils";

import {
    ActiveStatusBadge,
} from "../ui/ActiveStatusBadge";

interface SupplierProductsModalProps {
    supplier: Supplier | null;

    supplierProducts:
    ProductSupplier[];

    loadingSupplierProducts:
    boolean;

    supplierProductsError:
    string | null;

    hasLoadedSupplierProducts:
    boolean;

    isAdministrator:
    boolean;

    onRefresh:
    () => void;

    onUpsertRelation:
    (
        relation:
            ProductSupplier
    ) => void;

    onClose:
    () => void;
}


const normalizeText = (
    value: string | null
) =>
    (value ?? "")
        .trim()
        .toLocaleLowerCase(
            "es"
        );


export const SupplierProductsModal = ({
    supplier,
    supplierProducts,
    loadingSupplierProducts,
    supplierProductsError,
    hasLoadedSupplierProducts,
    isAdministrator,
    onRefresh,
    onUpsertRelation,
    onClose,
}: SupplierProductsModalProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    const [
        search,
        setSearch,
    ] = useState("");


    const [
        actionError,
        setActionError,
    ] = useState<
        string | null
    >(null);


    const [
        successMessage,
        setSuccessMessage,
    ] = useState<
        string | null
    >(null);


    const [
        changingProductIds,
        setChangingProductIds,
    ] = useState<
        Set<number>
    >(
        () =>
            new Set()
    );


    const pendingStatusChanges =
        useRef(
            new Set<number>()
        );


    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, []);

    const closeModal = () => {
        // Keep in-flight status operations attached to their supplier, including on reopen.
        if (pendingStatusChanges.current.size === 0) onClose();
    };


    const filteredProducts =
        useMemo(
            () => {
                const normalizedSearch =
                    normalizeText(
                        search
                    );


                return supplierProducts
                    .filter(
                        (
                            relation
                        ) => {
                            if (
                                !normalizedSearch
                            ) {
                                return true;
                            }


                            return [
                                relation.sku,
                                relation.productName,
                                relation.supplierProductCode,
                                relation.purchaseUnit,
                                relation.packageBarcode,
                            ].some(
                                (
                                    value
                                ) =>
                                    normalizeText(
                                        value
                                    ).includes(
                                        normalizedSearch
                                    )
                            );
                        }
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            Number(
                                second.isActive
                            ) -
                            Number(
                                first.isActive
                            ) ||
                            Number(
                                second.isPreferred
                            ) -
                            Number(
                                first.isPreferred
                            ) ||
                            first.productName.localeCompare(
                                second.productName,
                                "es",
                                {
                                    sensitivity:
                                        "base",
                                }
                            )
                    );
            },
            [
                supplierProducts,
                search,
            ]
        );


    const handleStatusChange =
        async (
            ppeProductId: number,
            isActive: boolean
        ) => {
            if (
                !supplier ||
                !isAdministrator ||
                pendingStatusChanges
                    .current
                    .has(
                        ppeProductId
                    )
            ) {
                return;
            }


            pendingStatusChanges
                .current
                .add(
                    ppeProductId
                );


            setChangingProductIds(
                (
                    current
                ) => {
                    const next =
                        new Set(
                            current
                        );

                    next.add(
                        ppeProductId
                    );

                    return next;
                }
            );


            setActionError(
                null
            );

            setSuccessMessage(
                null
            );


            try {
                const updated =
                    await productSuppliersService
                        .setStatus(
                            ppeProductId,
                            supplier.id,
                            {
                                isActive:
                                    !isActive,
                            }
                        );


                onUpsertRelation(
                    updated
                );


                setSuccessMessage(
                    updated.isActive
                        ? `Producto "${updated.productName}" activado para ${supplier.name}.`
                        : `Producto "${updated.productName}" desactivado para ${supplier.name}.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        isActive
                            ? "No fue posible desactivar el producto del proveedor."
                            : "No fue posible activar el producto para el proveedor."
                    )
                );
            } finally {
                pendingStatusChanges
                    .current
                    .delete(
                        ppeProductId
                    );


                setChangingProductIds(
                    (
                        current
                    ) => {
                        const next =
                            new Set(
                                current
                            );

                        next.delete(
                            ppeProductId
                        );

                        return next;
                    }
                );
            }
        };


    if (!supplier) {
        return null;
    }


    const isInitialLoading =
        loadingSupplierProducts &&
        !hasLoadedSupplierProducts;


    const isRefreshing =
        loadingSupplierProducts &&
        hasLoadedSupplierProducts;


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
            onMouseDown={(
                event
            ) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeModal();
                }
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="supplier-products-title"
                aria-busy={
                    loadingSupplierProducts
                }
                className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
                onKeyDown={(event) => {
                    if (event.key === "Escape") { event.preventDefault(); closeModal(); }
                    if (event.key !== "Tab") return;
                    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [tabindex='0']"));
                    const first = controls[0];
                    const last = controls[controls.length - 1];
                    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                }}
            >
                {/* HEADER */}

                <div className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5 sm:px-8">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Productos del proveedor
                        </p>

                        <h2
                            id="supplier-products-title"
                            className="mt-2 wrap-break-word text-xl font-semibold tracking-tight text-slate-950"
                        >
                            {
                                supplier.name
                            }
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Consulta los productos
                            asociados y administra
                            si la relación está
                            activa.
                        </p>
                    </div>


                    <button
                        type="button"
                        onClick={
                            closeModal
                        }
                        disabled={changingProductIds.size > 0}
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


                {/* CONTENT */}

                <div className="overflow-y-auto px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Productos asociados
                            </h3>

                            {hasLoadedSupplierProducts && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {
                                        supplierProducts.length
                                    }{" "}
                                    {supplierProducts.length ===
                                        1
                                        ? "producto configurado"
                                        : "productos configurados"}
                                </p>
                            )}
                        </div>


                        <button
                            type="button"
                            onClick={
                                onRefresh
                            }
                            disabled={
                                loadingSupplierProducts
                            }
                            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>
                    </div>


                    {/* SEARCH */}

                    {hasLoadedSupplierProducts &&
                        supplierProducts.length >
                        0 && (
                            <div className="mt-5">
                                <label
                                    htmlFor="supplier-product-search"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Buscar producto
                                </label>

                                <input
                                    id="supplier-product-search"
                                    type="search"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="SKU, producto, código del proveedor, unidad o código de barras"
                                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                                />
                            </div>
                        )}


                    {/* STATUS MESSAGES */}

                    {actionError && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            {
                                actionError
                            }
                        </div>
                    )}


                    {successMessage && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                        >
                            {
                                successMessage
                            }
                        </div>
                    )}


                    {supplierProductsError && (
                        <div
                            role="alert"
                            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                        >
                            {
                                supplierProductsError
                            }

                            <button
                                type="button"
                                onClick={
                                    onRefresh
                                }
                                disabled={
                                    loadingSupplierProducts
                                }
                                className="ml-3 font-semibold underline underline-offset-2"
                            >
                                Reintentar
                            </button>
                        </div>
                    )}


                    {/* INITIAL LOADING */}

                    {isInitialLoading && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-sky-100 bg-sky-50 px-5 py-8 text-center text-sm text-sky-800"
                        >
                            <span
                                aria-hidden="true"
                                className="mx-auto mb-3 block h-6 w-6 rounded-full border-2 border-sky-200 border-t-sky-700 motion-safe:animate-spin"
                            />

                            Cargando productos
                            del proveedor...
                        </div>
                    )}


                    {/* EMPTY */}

                    {!loadingSupplierProducts &&
                        hasLoadedSupplierProducts &&
                        !supplierProductsError &&
                        supplierProducts.length ===
                        0 && (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-900">
                                    No hay productos
                                    asociados.
                                </p>

                                <p className="mt-2 text-sm text-slate-500">
                                    Este proveedor
                                    todavía no tiene
                                    productos
                                    configurados.
                                </p>
                            </div>
                        )}


                    {/* SEARCH EMPTY */}

                    {hasLoadedSupplierProducts &&
                        supplierProducts.length >
                        0 &&
                        filteredProducts.length ===
                        0 && (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-600">
                                No hay productos
                                que coincidan con
                                la búsqueda.
                            </div>
                        )}


                    {/* TABLE */}

                    {hasLoadedSupplierProducts &&
                        filteredProducts.length >
                        0 && (
                            <div
                                tabIndex={0}
                                role="region"
                                aria-label={`Productos asociados a ${supplier.name}`}
                                className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                            >
                                <table className="w-full min-w-245 text-left text-sm">
                                    <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                        <tr>
                                            <th className="px-5 py-3">
                                                SKU
                                            </th>

                                            <th className="px-5 py-3">
                                                Producto
                                            </th>

                                            <th className="px-5 py-3">
                                                Código proveedor
                                            </th>

                                            <th className="px-5 py-3">
                                                Compra
                                            </th>

                                            <th className="px-5 py-3 text-right">
                                                Por paquete
                                            </th>

                                            <th className="px-5 py-3">
                                                Preferido
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
                                    {filteredProducts.map(
                                            (
                                                relation
                                            ) => {
                                                const isChanging =
                                                    changingProductIds.has(
                                                        relation.ppeProductId
                                                    );

                                                const cannotReactivate =
                                                    !supplier.isActive &&
                                                    !relation.isActive;


                                                return (
                                                    <tr
                                                        key={
                                                            relation.ppeProductId
                                                        }
                                                        className="transition-colors hover:bg-sky-50/40 motion-reduce:transition-none"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                                                            {
                                                                relation.sku
                                                            }
                                                        </td>


                                                        <td className="max-w-64 wrap-break-word px-5 py-4 font-medium text-slate-900">
                                                            {
                                                                relation.productName
                                                            }
                                                        </td>


                                                        <td className="px-5 py-4 text-slate-600">
                                                            {
                                                                relation.supplierProductCode ??
                                                                "—"
                                                            }
                                                            {relation.packageBarcode && <p className="mt-1 break-all text-xs text-slate-500">Código de barras: {relation.packageBarcode}</p>}
                                                        </td>


                                                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                            {
                                                                relation.purchaseUnit
                                                            }

                                                            {relation.purchaseUnitSymbol
                                                                ? ` (${relation.purchaseUnitSymbol})`
                                                                : ""}
                                                        </td>


                                                        <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-700">
                                                            {
                                                                relation.unitsPerPackage
                                                            }
                                                        </td>


                                                        <td className="px-5 py-4">
                                                            {relation.isPreferred ? (
                                                                <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-200">
                                                                    Sí
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-slate-500">
                                                                    No
                                                                </span>
                                                            )}
                                                        </td>


                                                        <td className="px-5 py-4">
                                                            <ActiveStatusBadge
                                                                isActive={
                                                                    relation.isActive
                                                                }
                                                            />
                                                        </td>


                                                        {isAdministrator && (
                                                            <td className="whitespace-nowrap px-5 py-4 text-right">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        isChanging ||
                                                                        cannotReactivate
                                                                    }
                                                                    onClick={() =>
                                                                        void handleStatusChange(
                                                                            relation.ppeProductId,
                                                                            relation.isActive
                                                                        )
                                                                    }
                                                                    title={
                                                                        cannotReactivate
                                                                            ? "Activa primero el proveedor."
                                                                            : undefined
                                                                    }
                                                                    className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${relation.isActive
                                                                        ? "border-amber-200 bg-white text-amber-800 enabled:hover:bg-amber-50"
                                                                        : "border-emerald-200 bg-white text-emerald-700 enabled:hover:bg-emerald-50"
                                                                        }`}
                                                                >
                                                                    {isChanging
                                                                        ? "Guardando..."
                                                                        : relation.isActive
                                                                            ? "Desactivar"
                                                                            : "Activar"}
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                </div>


                {/* FOOTER */}

                <div className="flex justify-end border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:px-8">
                    <button
                        type="button"
                        onClick={
                            closeModal
                        }
                        disabled={changingProductIds.size > 0}
                        className="min-h-11 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
