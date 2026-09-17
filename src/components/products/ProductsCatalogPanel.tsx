import { memo, useMemo, useEffect, useRef } from "react";
import type { PPEProduct } from "../../types/types";
import { normalizeProductText } from "../../utils/productText";
import { StatCard } from "../ui/StatCard";
import { ActiveStatusBadge } from "../ui/ActiveStatusBadge";

type StatusFilter = "all" | "active" | "inactive";

interface ProductsCatalogPanelProps {
    products: PPEProduct[];
    search: string;
    setSearch: (value: string) => void;
    statusFilter: StatusFilter;
    setStatusFilter: (value: StatusFilter) => void;
    categoryFilter: string;
    setCategoryFilter: (value: string) => void;
    setSuccessMessage: (value: string | null) => void;
    hasFilters: boolean;
    clearFilters: () => void;
    isAdministrator: boolean;
    isSubmitting: boolean;
    changingStatusId: number | null;
    actionError: string | null;
    startEditing: (product: PPEProduct) => void;
    handleStatusChange: (product: PPEProduct) => Promise<void>;
    refresh: () => Promise<void>;
    loading: boolean;
    selectedProductIds: Set<number>;
    onAssignSelected: () => void;

    toggleProductSelection: (
        productId: number,
        selected: boolean
    ) => void;

    setProductsSelection: (
        productIds: number[],
        selected: boolean
    ) => void;

    onAssignProduct: (
        product: PPEProduct
    ) => void;

    clearProductSelection: () => void;
}

// Stable props let the loaded table skip renders caused by typing in the form.
export const ProductsCatalogPanel = memo(function ProductsCatalogPanel({
    products, search, setSearch, statusFilter, setStatusFilter,
    categoryFilter, setCategoryFilter, setSuccessMessage, hasFilters, clearFilters,
    isAdministrator, isSubmitting, changingStatusId, actionError,
    startEditing, handleStatusChange, refresh, loading, selectedProductIds, toggleProductSelection,
    setProductsSelection, clearProductSelection, onAssignSelected, onAssignProduct,
}: ProductsCatalogPanelProps) {
    const filterCategories = useMemo(() => Array.from(
        new Map(products.map((product) => [product.categoryId, product.categoryName]))
    ).sort((first, second) => first[1].localeCompare(second[1], "es")), [products]);

    const summary = useMemo(() => {
        const active = products.filter((product) => product.isActive).length;
        return { total: products.length, active, inactive: products.length - active };
    }, [products]);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = normalizeProductText(search);

        return products
            .filter((product) => {
                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === "active" ? product.isActive : !product.isActive);
                const matchesCategory = !categoryFilter || product.categoryId === Number(categoryFilter);
                const matchesSearch = [
                    product.sku, product.name, product.description, product.categoryName,
                    product.size, product.color, product.model, product.specification, product.stockUnit,
                ].some((value) => normalizeProductText(value).includes(normalizedSearch));

                return matchesStatus && matchesCategory && matchesSearch;
            })
            .sort((first, second) =>
                Number(second.isActive) - Number(first.isActive) ||
                first.name.localeCompare(second.name, "es", { sensitivity: "base" }) ||
                first.sku.localeCompare(second.sku, "es", { numeric: true })
            );
    }, [products, search, statusFilter, categoryFilter]);

    const visibleActiveProductIds =
        useMemo(
            () =>
                filteredProducts
                    .filter(
                        (product) =>
                            product.isActive
                    )
                    .map(
                        (product) =>
                            product.id
                    ),
            [filteredProducts]
        );

    const selectedVisibleCount =
        useMemo(
            () =>
                visibleActiveProductIds
                    .filter(
                        (id) =>
                            selectedProductIds.has(id)
                    )
                    .length,
            [
                visibleActiveProductIds,
                selectedProductIds,
            ]
        );

    const allVisibleSelected =
        visibleActiveProductIds.length > 0 &&
        selectedVisibleCount ===
        visibleActiveProductIds.length;

    const someVisibleSelected =
        selectedVisibleCount > 0 &&
        !allVisibleSelected;

    const selectAllRef =
        useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate =
                someVisibleSelected;
        }
    }, [someVisibleSelected]);

    return (
        <div className="space-y-6">
            <dl aria-label="Resumen de productos" aria-busy={false} className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                {[
                    { label: "Total de productos", value: summary.total },
                    { label: "Productos activos", value: summary.active },
                    { label: "Productos inactivos", value: summary.inactive },
                ].map((item) => (
                    <StatCard key={item.label} label={item.label} value={item.value} />
                ))}
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Productos registrados
                        </h2>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            disabled={loading}
                            className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                        >
                            {loading ? "Actualizando..." : "Actualizar"}
                        </button>
                        {(
                            <p role="status" aria-atomic="true" className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tabular-nums text-sky-800 ring-1 ring-inset ring-sky-200">
                                {filteredProducts.length} {filteredProducts.length === 1 ? "resultado" : "resultados"}
                            </p>
                        )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Consulta las variantes, la clasificación y el stock mínimo de tus artículos.</p>
                    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-5 xl:flex xl:items-end">
                        <div className="min-w-0 sm:col-span-2 xl:flex-1">
                            <label htmlFor="product-search" className="block text-sm font-medium text-slate-700">Buscar productos</label>
                            <input
                                id="product-search"
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="off"
                                placeholder="SKU, nombre, descripción o características"
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none" />
                        </div>
                        <div className="min-w-0 xl:w-52">
                            <label htmlFor="product-category-filter" className="block text-sm font-medium text-slate-700">Categoría</label>
                            <select
                                id="product-category-filter"
                                value={categoryFilter}
                                onChange={(event) => {
                                    setCategoryFilter(event.target.value);
                                    setSuccessMessage(null);
                                }}
                                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none">
                                <option value="">Todas las categorías</option>
                                {filterCategories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                            </select>
                        </div>
                        <div className="min-w-0 xl:w-40">
                            <label htmlFor="product-status" className="block text-sm font-medium text-slate-700">Estado</label>
                            <select
                                id="product-status"
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value as StatusFilter);
                                    setSuccessMessage(null);
                                }}
                                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none">
                                <option value="all">Todos</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                        </div>
                        {hasFilters && (
                            <button type="button" onClick={clearFilters} className="min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none sm:col-span-2">
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {actionError && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {products.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9" /></svg>
                            <p className="text-sm font-semibold text-slate-900">Aún no hay productos registrados</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Los artículos aparecerán aquí cuando se agreguen al catálogo.</p>
                        </div>
                    )}

                {products.length > 0 && filteredProducts.length === 0 && (
                    <div className="m-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-900">No encontramos coincidencias.</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Prueba con otro término o elimina los filtros.</p>
                    </div>
                )}

                {isAdministrator &&
                    selectedProductIds.size > 0 && (
                        <div className="mx-6 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                            <p className="text-sm font-semibold text-sky-900">
                                {selectedProductIds.size}{" "}
                                {selectedProductIds.size === 1
                                    ? "producto seleccionado"
                                    : "productos seleccionados"}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        clearProductSelection
                                    }
                                    className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
                                >
                                    Limpiar selección
                                </button>

                                <button
                                    type="button"
                                    onClick={
                                        onAssignSelected
                                    }
                                    className="min-h-11 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
                                >
                                    Asignar a almacenes
                                </button>
                            </div>
                        </div>
                    )}

                {filteredProducts.length > 0 && (
                    <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Productos registrados">
                        <table className="w-full min-w-240 text-left text-sm">
                            <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">

                                <tr>
                                    {isAdministrator && (
                                        <th
                                            scope="col"
                                            className="w-14 px-5 py-3"
                                        >
                                            <input
                                                ref={selectAllRef}
                                                type="checkbox"
                                                checked={
                                                    allVisibleSelected
                                                }
                                                disabled={
                                                    visibleActiveProductIds.length ===
                                                    0
                                                }
                                                onChange={() =>
                                                    setProductsSelection(
                                                        visibleActiveProductIds,
                                                        !allVisibleSelected
                                                    )
                                                }
                                                aria-label="Seleccionar productos activos visibles"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                                            />
                                        </th>
                                    )}

                                    <th scope="col" className="px-5 py-3">
                                        SKU
                                    </th>

                                    <th scope="col" className="px-5 py-3">
                                        Producto
                                    </th>

                                    <th scope="col" className="px-5 py-3">
                                        Categoría
                                    </th>

                                    <th scope="col" className="px-5 py-3">
                                        Variante
                                    </th>

                                    <th scope="col" className="px-5 py-3 text-right">
                                        Mínimo
                                    </th>

                                    <th scope="col" className="px-5 py-3">
                                        Estado
                                    </th>

                                    {isAdministrator && (
                                        <th scope="col" className="px-5 py-3 text-right">
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredProducts.map(
                                    (
                                        product
                                    ) => (
                                        <tr
                                            className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                            key={
                                                product.id
                                            }
                                        >
                                            {isAdministrator && (
                                                <td className="px-5 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selectedProductIds.has(
                                                                product.id
                                                            )
                                                        }
                                                        disabled={
                                                            !product.isActive
                                                        }
                                                        onChange={(event) =>
                                                            toggleProductSelection(
                                                                product.id,
                                                                event.target.checked
                                                            )
                                                        }
                                                        aria-label={`Seleccionar ${product.sku} ${product.name}`}
                                                        className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-5 py-4 font-mono text-xs font-medium text-slate-700">
                                                {
                                                    product.sku
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {
                                                        product.name
                                                    }
                                                </p>

                                                {product.description && (
                                                    <p className="mt-1 max-w-xs wrap-break-word text-xs leading-5 text-slate-500">
                                                        {
                                                            product.description
                                                        }
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {
                                                    product.categoryName
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {[
                                                    product.size,
                                                    product.color,
                                                    product.model,
                                                ]
                                                    .filter(
                                                        Boolean
                                                    )
                                                    .join(
                                                        " · "
                                                    ) ||
                                                    "—"}
                                            </td>

                                            <td className="px-5 py-4 text-right text-slate-700">
                                                {
                                                    product.minimumStock
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                <ActiveStatusBadge isActive={product.isActive} />
                                            </td>

                                            {isAdministrator && (
                                                <td className="px-5 py-4">
                                                    <div className="ml-auto grid w-40 grid-cols-1 gap-2 sm:w-[28rem] sm:grid-cols-3">                                                        <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(
                                                                product
                                                            )
                                                        }
                                                        disabled={
                                                            isSubmitting ||
                                                            changingStatusId !== null
                                                        }
                                                        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                    >
                                                        <svg
                                                            aria-hidden="true"
                                                            className="h-4 w-4 shrink-0"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z" />
                                                        </svg>
                                                        Editar
                                                    </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onAssignProduct(product)
                                                            }
                                                            disabled={
                                                                !product.isActive ||
                                                                isSubmitting ||
                                                                changingStatusId !== null
                                                            }
                                                            className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <svg
                                                                aria-hidden="true"
                                                                className="h-4 w-4 shrink-0"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M12 5v14M5 12h14" />
                                                            </svg>

                                                            Asignar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleStatusChange(
                                                                    product
                                                                )
                                                            }
                                                            disabled={
                                                                changingStatusId !== null ||
                                                                isSubmitting
                                                            }
                                                            className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${product.isActive
                                                                ? "border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:border-amber-300 enabled:hover:bg-amber-100 focus-visible:ring-amber-100"
                                                                : "border-emerald-200 bg-emerald-50 text-emerald-800 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus-visible:ring-emerald-100"
                                                                }`}
                                                        >
                                                            {changingStatusId ===
                                                                product.id
                                                                ? "Guardando..."
                                                                : product.isActive
                                                                    ? "Desactivar"
                                                                    : "Activar"}
                                                        </button>
                                                    </div>
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
    );
});
