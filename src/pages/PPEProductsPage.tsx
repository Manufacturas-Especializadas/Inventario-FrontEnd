import {
    useMemo,
    useEffect,
    useCallback,
    useRef,
    useState,
    type FormEvent,
} from "react";

import {
    ppeProductsService,
} from "../api/services/PPEProductsService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    usePPECategories,
} from "../hooks/usePPECategories";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import {
    useSizes,
} from "../hooks/useSizes";

import {
    useColors,
} from "../hooks/useColors";

import {
    useUnits,
} from "../hooks/useUnits";

import type {
    PPEProduct,
    BulkAssignWarehouseProductsResult
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import {
    ProductWarehouseAssignmentModal,
} from "../components/products/ProductWarehouseAssignmentModal";


import { PageHeader } from "../components/ui/PageHeader";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";
import { ProductsCatalogPanel } from "../components/products/ProductsCatalogPanel";
import { normalizeProductText } from "../utils/productText";
import { useSuppliers } from "../hooks/useSuppliers";
import { useSupplierProducts } from "../hooks/useSupplierProducts";
import { ProductSupplierAssignmentModal } from "../components/products/ProductSupplierAssignmentModal";

type StatusFilter = "all" | "active" | "inactive";
type ProductFormField = "category" | "name" | "size" | "color" | "stock-unit" | "minimum-stock" | "max-cycle" | "replacement-days";

export const PPEProductsPage = () => {
    const {
        products,
        loading,
        error,
        refresh,
        hasLoaded,
        upsertProduct,
    } = usePPEProducts({ autoLoad: false });

    const {
        categories,
        loading:
        loadingCategories,
        error: categoriesError,
        hasLoaded: categoriesLoaded,
        refresh: refreshCategories,
    } = usePPECategories({ autoLoad: false });

    const [
        selectedProductIds,
        setSelectedProductIds,
    ] = useState<Set<number>>(
        () => new Set()
    );

    const {
        activeSizes,
        loading: loadingSizes,
        error: sizesError,
        hasLoaded: sizesLoaded,
        refresh: refreshSizes,
    } = useSizes({ autoLoad: false });

    const {
        activeColors,
        loading: loadingColors,
        error: colorsError,
        hasLoaded: colorsLoaded,
        refresh: refreshColors,
    } = useColors({ autoLoad: false });

    const {
        activeUnits,
        loading: loadingUnits,
        error: unitsError,
        hasLoaded: unitsLoaded,
        refresh: refreshUnits,
    } = useUnits({ autoLoad: false });

    const {
        suppliers, hasLoaded: suppliersLoaded, loading: loadingSuppliers,
        error: suppliersError, refresh: refreshSuppliers,
    } = useSuppliers({ autoLoad: false });
    const [supplierAssignmentProducts, setSupplierAssignmentProducts] = useState<PPEProduct[] | null>(null);
    const [assignmentSupplierId, setAssignmentSupplierId] = useState<number | null>(null);
    // Keep the keyed relation cache alive when the assignment modal closes.
    const supplierRelations = useSupplierProducts(assignmentSupplierId);
    const loadSupplierCatalogs = () => Promise.all([
        !suppliersLoaded || suppliersError ? refreshSuppliers() : Promise.resolve(),
        !unitsLoaded || unitsError ? refreshUnits() : Promise.resolve(),
    ]);

    const loadingCatalogs =
        loadingCategories ||
        loadingSizes ||
        loadingColors ||
        loadingUnits;

    const catalogError =
        categoriesError ||
        sizesError ||
        colorsError ||
        unitsError;

    const {
        warehouses,
        loading: loadingWarehouses,
        error: warehousesError,
        hasLoaded: warehousesLoaded,
        refresh: refreshWarehouses,
    } = useWarehouses({
        autoLoad: false,
    });

    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole(
            "Administrator"
        );

    const openSupplierAssignment = () => {
        if (!isAdministrator) return;
        const selected = products.filter((product) => product.isActive && selectedProductIds.has(product.id));
        if (!selected.length) return;
        setAssignmentSupplierId(null);
        setSupplierAssignmentProducts(selected);
        void loadSupplierCatalogs();
    };

    const [showForm, setShowForm] = useState(false);
    const formPanelRef = useRef<HTMLDivElement>(null);
    const formLoadRequest = useRef<Promise<unknown[]> | null>(null);
    const formDataReady = hasLoaded && categoriesLoaded && sizesLoaded && colorsLoaded && unitsLoaded;
    const formDataError = catalogError || (!hasLoaded ? error : null);

    const loadFormData = useCallback(() => {
        if (formLoadRequest.current) {
            return formLoadRequest.current;
        }

        const requests: Promise<unknown>[] = [];
        if (!hasLoaded) requests.push(refresh());
        if (!categoriesLoaded) requests.push(refreshCategories());
        if (!sizesLoaded) requests.push(refreshSizes());
        if (!colorsLoaded) requests.push(refreshColors());
        if (!unitsLoaded) requests.push(refreshUnits());

        const request = Promise.all(requests);
        formLoadRequest.current = request;
        void request.finally(() => {
            formLoadRequest.current = null;
        });
        return request;
    }, [
        hasLoaded, categoriesLoaded, sizesLoaded, colorsLoaded, unitsLoaded,
        refresh, refreshCategories, refreshSizes, refreshColors, refreshUnits,
    ]);

    const toggleForm = () => {
        if (!isAdministrator) return;
        const nextOpen = !showForm;
        setShowForm(nextOpen);
        if (nextOpen) void loadFormData();
    };

    const [
        categoryId,
        setCategoryId,
    ] = useState("");

    const [
        warehouseAssignmentOpen,
        setWarehouseAssignmentOpen,
    ] = useState(false);

    const [
        assignmentProductIds,
        setAssignmentProductIds,
    ] = useState<Set<number>>(
        () => new Set()
    );

    const [
        assignmentMode,
        setAssignmentMode,
    ] = useState<"bulk" | "single">(
        "bulk"
    );

    const [
        name,
        setName,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        sizeId,
        setSizeId,
    ] = useState("");

    const [
        colorId,
        setColorId,
    ] = useState("");

    const [
        model,
        setModel,
    ] = useState("");

    const [
        specification,
        setSpecification,
    ] = useState("");

    const [
        stockUnitId,
        setStockUnitId,
    ] = useState("");

    const [
        minimumStock,
        setMinimumStock,
    ] = useState("0");

    const [
        defaultMaxQuantityPerCycle,
        setDefaultMaxQuantityPerCycle,
    ] = useState("");

    const [
        replacementIntervalDays,
        setReplacementIntervalDays,
    ] = useState("");

    const [
        formError,
        setFormError,
    ] = useState<string | null>(
        null
    );

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [invalidField, setInvalidField] = useState<ProductFormField | null>(null);

    const [
        editingProductId,
        setEditingProductId,
    ] = useState<number | null>(null);

    useEffect(() => {
        if (showForm) {
            formPanelRef.current?.focus({ preventScroll: true });
            formPanelRef.current?.scrollIntoView({
                block: "start",
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
            });
        }
    }, [showForm, editingProductId, formDataReady]);

    const [
        changingStatusId,
        setChangingStatusId,
    ] = useState<number | null>(null);

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(null);

    const activeCategories = useMemo(() => categories
        .filter((category) => category.isActive)
        .sort((first, second) => first.name.localeCompare(second.name, "es")), [categories]);

    const duplicateProduct = useMemo(() => {
        if (!categoryId || !name.trim() || !stockUnitId) {
            return undefined;
        }

        const selectedSizeId =
            sizeId
                ? Number(sizeId)
                : null;

        const selectedColorId =
            colorId
                ? Number(colorId)
                : null;

        return products.find((product) =>
            product.id !== editingProductId &&
            product.categoryId === Number(categoryId) &&
            normalizeProductText(product.name) === normalizeProductText(name) &&
            product.sizeId === selectedSizeId &&
            product.colorId === selectedColorId &&
            normalizeProductText(product.model) === normalizeProductText(model) &&
            normalizeProductText(product.specification) === normalizeProductText(specification) &&
            product.stockUnitId === Number(stockUnitId)
        );
    }, [
        products,
        categoryId,
        name,
        sizeId,
        colorId,
        model,
        specification,
        stockUnitId,
        editingProductId,
    ]);

    const hasFilters = search.length > 0 || statusFilter !== "all" || categoryFilter !== "";

    const clearFilters = useCallback(() => {
        setSearch("");
        setStatusFilter("all");
        setCategoryFilter("");
        setSuccessMessage(null);
    }, []);

    const reportFormError = (field: ProductFormField, message: string) => {
        setInvalidField(field);
        setFormError(message);
    };

    const resetForm = useCallback(() => {
        setCategoryId("");
        setName("");
        setDescription("");
        setSizeId("");
        setColorId("");
        setModel("");
        setSpecification("");
        setStockUnitId("");
        setMinimumStock("0");
        setDefaultMaxQuantityPerCycle("");
        setReplacementIntervalDays("");
        setEditingProductId(null);
        setInvalidField(null);
        setFormError(null);
    }, []);

    const startEditing = useCallback((
        product: PPEProduct
    ) => {
        setShowForm(true);
        void loadFormData();
        setEditingProductId(product.id);
        setCategoryId(String(product.categoryId));
        setName(product.name);
        setDescription(product.description ?? "");
        setSizeId(
            product.sizeId !== null
                ? String(product.sizeId)
                : ""
        );
        setColorId(
            product.colorId !== null
                ? String(product.colorId)
                : ""
        );
        setModel(product.model ?? "");
        setSpecification(
            product.specification ?? ""
        );
        setStockUnitId(
            String(product.stockUnitId)
        );
        setMinimumStock(
            String(product.minimumStock)
        );
        setDefaultMaxQuantityPerCycle(
            product.defaultMaxQuantityPerCycle !== null
                ? String(
                    product.defaultMaxQuantityPerCycle
                )
                : ""
        );
        setReplacementIntervalDays(
            product.replacementIntervalDays !== null
                ? String(
                    product.replacementIntervalDays
                )
                : ""
        );

        setFormError(null);
        setInvalidField(null);
        setActionError(null);
        setSuccessMessage(null);
    }, [loadFormData]);

    const cancelEditing = () => {
        resetForm();
        setSuccessMessage(null);
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !isAdministrator ||
                isSubmitting ||
                loading ||
                loadingCatalogs ||
                catalogError ||
                !formDataReady
            ) {
                return;
            }

            setFormError(null);
            setInvalidField(null);
            setSuccessMessage(null);

            if (!activeCategories.some((category) => category.id === Number(categoryId))) {
                reportFormError(
                    "category", "Selecciona una categoría activa."
                );

                return;
            }

            if (!name.trim()) {
                reportFormError(
                    "name", "El nombre del producto es obligatorio."
                );

                return;
            }

            if (
                sizeId &&
                !activeSizes.some(
                    (size) =>
                        size.id === Number(sizeId)
                )
            ) {
                reportFormError(
                    "size",
                    "Selecciona una talla activa."
                );

                return;
            }

            if (
                colorId &&
                !activeColors.some(
                    (color) =>
                        color.id === Number(colorId)
                )
            ) {
                reportFormError(
                    "color",
                    "Selecciona un color activo."
                );

                return;
            }

            if (
                !activeUnits.some(
                    (unit) =>
                        unit.id === Number(stockUnitId)
                )
            ) {
                reportFormError(
                    "stock-unit",
                    "Selecciona una unidad de inventario activa."
                );

                return;
            }

            const minimum =
                Number(
                    minimumStock
                );

            if (
                !Number.isFinite(
                    minimum
                ) ||
                minimum < 0
            ) {
                reportFormError(
                    "minimum-stock", "El stock mínimo debe ser igual o mayor a cero."
                );

                return;
            }

            const maximum = defaultMaxQuantityPerCycle.trim() ? Number(defaultMaxQuantityPerCycle) : null;
            const interval = replacementIntervalDays.trim() ? Number(replacementIntervalDays) : null;

            if (maximum !== null && (!Number.isFinite(maximum) || maximum < 1)) {
                reportFormError("max-cycle", "El máximo por ciclo debe ser igual o mayor a uno.");
                return;
            }

            if (interval !== null && (!Number.isInteger(interval) || interval < 1)) {
                reportFormError("replacement-days", "El intervalo de reemplazo debe ser un número entero de días mayor a cero.");
                return;
            }

            if (duplicateProduct) {
                return;
            }

            setIsSubmitting(true);

            try {
                const request = {
                    categoryId:
                        Number(categoryId),

                    name:
                        name.trim(),

                    description:
                        description.trim() ||
                        null,

                    sizeId:
                        sizeId
                            ? Number(sizeId)
                            : null,

                    colorId:
                        colorId
                            ? Number(colorId)
                            : null,

                    model:
                        model.trim() ||
                        null,

                    specification:
                        specification.trim() ||
                        null,

                    stockUnitId:
                        Number(stockUnitId),

                    minimumStock:
                        minimum,

                    defaultMaxQuantityPerCycle:
                        maximum,

                    replacementIntervalDays:
                        interval,
                };

                if (editingProductId !== null) {
                    const updatedProduct =
                        await ppeProductsService.update(
                            editingProductId,
                            request
                        );

                    resetForm();

                    upsertProduct(updatedProduct);

                    setSuccessMessage(
                        `Producto "${updatedProduct.name}" (${updatedProduct.sku}) actualizado correctamente.`
                    );
                } else {
                    const createdProduct =
                        await ppeProductsService.create(
                            request
                        );

                    resetForm();
                    clearFilters();

                    upsertProduct(createdProduct);

                    setSuccessMessage(
                        `Producto "${createdProduct.name}" (${createdProduct.sku}) creado correctamente.`
                    );
                }
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        editingProductId !== null
                            ? "No fue posible actualizar el producto."
                            : "No fue posible crear el producto."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const handleStatusChange =
        useCallback(async (
            product: PPEProduct
        ) => {
            if (
                !isAdministrator ||
                changingStatusId !== null ||
                isSubmitting
            ) {
                return;
            }

            setActionError(null);
            setSuccessMessage(null);
            setChangingStatusId(
                product.id
            );

            try {
                const updatedProduct =
                    await ppeProductsService.setStatus(
                        product.id,
                        {
                            isActive:
                                !product.isActive,
                        }
                    );

                upsertProduct(updatedProduct);

                if (!updatedProduct.isActive) {
                    setSelectedProductIds(
                        (current) => {
                            if (
                                !current.has(
                                    updatedProduct.id
                                )
                            ) {
                                return current;
                            }

                            const next =
                                new Set(current);

                            next.delete(
                                updatedProduct.id
                            );

                            return next;
                        }
                    );
                }

                if (
                    editingProductId ===
                    product.id &&
                    !updatedProduct.isActive
                ) {
                    resetForm();
                }

                setSuccessMessage(
                    `Producto "${updatedProduct.name}" ${updatedProduct.isActive
                        ? "activado"
                        : "desactivado"
                    } correctamente.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        product.isActive
                            ? "No fue posible desactivar el producto."
                            : "No fue posible activar el producto."
                    )
                );
            } finally {
                setChangingStatusId(
                    null
                );
            }
        }, [isAdministrator, changingStatusId, isSubmitting, upsertProduct, editingProductId, resetForm]);

    const toggleProductSelection =
        useCallback(
            (
                productId: number,
                selected: boolean
            ) => {
                setSelectedProductIds(
                    (current) => {
                        const next =
                            new Set(current);

                        if (selected) {
                            next.add(productId);
                        } else {
                            next.delete(productId);
                        }

                        return next;
                    }
                );
            },
            []
        );

    const setProductsSelection =
        useCallback(
            (
                productIds: number[],
                selected: boolean
            ) => {
                setSelectedProductIds(
                    (current) => {
                        const next =
                            new Set(current);

                        for (const productId of productIds) {
                            if (selected) {
                                next.add(productId);
                            } else {
                                next.delete(productId);
                            }
                        }

                        return next;
                    }
                );
            },
            []
        );


    const clearProductSelection =
        useCallback(() => {
            setSelectedProductIds(
                new Set()
            );
        }, []);

    const openWarehouseAssignment =
        useCallback(() => {
            if (
                !isAdministrator ||
                selectedProductIds.size === 0
            ) {
                return;
            }

            setSuccessMessage(null);

            setAssignmentProductIds(
                new Set(selectedProductIds)
            );

            setAssignmentMode("bulk");

            setWarehouseAssignmentOpen(true);
        }, [
            isAdministrator,
            selectedProductIds,
        ]);

    const openSingleWarehouseAssignment =
        useCallback(
            (product: PPEProduct) => {
                if (
                    !isAdministrator ||
                    !product.isActive
                ) {
                    return;
                }

                setSuccessMessage(null);

                setAssignmentProductIds(
                    new Set([product.id])
                );

                setAssignmentMode("single");

                setWarehouseAssignmentOpen(true);
            },
            [isAdministrator]
        );

    const closeWarehouseAssignment =
        useCallback(() => {
            setWarehouseAssignmentOpen(false);
            setAssignmentProductIds(
                new Set()
            );
        }, []);

    const handleWarehouseAssignmentSuccess =
        useCallback(
            (
                result:
                    BulkAssignWarehouseProductsResult
            ) => {
                setWarehouseAssignmentOpen(false);
                setAssignmentProductIds(
                    new Set()
                );

                if (assignmentMode === "bulk") {
                    clearProductSelection();
                }

                setSuccessMessage(
                    `Asignación completada: ${result.createdCount} nuevas, ${result.reactivatedCount} reactivadas y ${result.alreadyActiveCount} ya estaban activas.`
                );
            },
            [
                assignmentMode,
                clearProductSelection,
            ]
        );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Productos de inventario"
                description="Un catálogo organizado para los artículos, materiales y recursos de MESA."
            />

            <div className="flex flex-wrap gap-3">
                {isAdministrator && (
                    <button
                        type="button"
                        onClick={toggleForm}
                        aria-expanded={showForm}
                        aria-controls="products-form-panel"
                        className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        {showForm ? "Ocultar formulario" : editingProductId !== null ? "Mostrar edición" : "Nuevo producto"}
                        <svg aria-hidden="true" className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${showForm ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading}
                    aria-controls="products-list-panel"
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                >
                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
                    </svg>
                    {loading ? "Cargando productos..." : hasLoaded ? "Actualizar productos" : "Cargar productos"}
                </button>
            </div>

            {isAdministrator && successMessage && !formError && (
                <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800">
                    {successMessage}
                </div>
            )}

            <section id="products-list-panel" aria-labelledby="products-catalog-title" aria-busy={loading} className="space-y-6">
                <h2 id="products-catalog-title" className="text-lg font-semibold text-slate-900">Catálogo de productos</h2>
                {error && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        <p>{error}</p>
                        {hasLoaded && <p className="mt-2">Se conservan los productos de la última carga.</p>}
                        <button type="button" disabled={loading} onClick={() => void refresh()} className="mt-4 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-semibold transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none">Reintentar</button>
                    </div>
                )}
                {!hasLoaded && (loading ? <CatalogLoadingSkeleton label="Cargando productos" /> : !error && (
                    <div className="rounded-2xl border border-dashed border-sky-200 bg-white px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-900">Los productos todavía no se han cargado.</p>
                        <p className="mt-2 text-sm text-slate-600">Carga el catálogo para consultar y filtrar los productos.</p>
                        <button type="button" onClick={() => void refresh()} className="mt-5 min-h-11 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none">Cargar productos</button>
                    </div>
                ))}
                {hasLoaded && (
                    <ProductsCatalogPanel
                        products={products}
                        search={search}
                        setSearch={setSearch}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        categoryFilter={categoryFilter}
                        setCategoryFilter={setCategoryFilter}
                        setSuccessMessage={setSuccessMessage}
                        hasFilters={hasFilters}
                        clearFilters={clearFilters}
                        isAdministrator={isAdministrator}
                        isSubmitting={isSubmitting}
                        changingStatusId={changingStatusId}
                        actionError={actionError}
                        startEditing={startEditing}
                        handleStatusChange={handleStatusChange}
                        refresh={refresh}
                        loading={loading}
                        selectedProductIds={selectedProductIds}
                        toggleProductSelection={toggleProductSelection}
                        setProductsSelection={setProductsSelection}
                        clearProductSelection={clearProductSelection}
                        onAssignSelected={openWarehouseAssignment}
                        onAssignSuppliers={openSupplierAssignment}
                        onAssignProduct={openSingleWarehouseAssignment}
                    />
                )}
            </section>

            <div ref={formPanelRef} id="products-form-panel" role="region" aria-label={editingProductId !== null ? "Editar producto" : "Nuevo producto"} tabIndex={-1} className="scroll-mt-6 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100" hidden={!isAdministrator || !showForm}>
                {isAdministrator && showForm && (!formDataReady || loadingCatalogs || formDataError) && (
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {formDataError && !loadingCatalogs && !loading ? (
                            <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                                <p>{formDataError}</p>
                                <button type="button" onClick={() => void loadFormData()} className="mt-4 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-semibold transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none">Reintentar</button>
                            </div>
                        ) : <CatalogLoadingSkeleton label="Cargando datos del formulario de productos" />}
                    </section>
                )}
                {isAdministrator && showForm && formDataReady && !formDataError && !loadingCatalogs && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" /></svg>
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {editingProductId !== null
                                        ? "Editar producto"
                                        : "Nuevo producto"}
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    {editingProductId !== null
                                        ? "Modifica las características y parámetros del producto seleccionado."
                                        : "Define sus características y los parámetros de inventario."}
                                </p>
                            </div>
                        </div>

                        {!loadingCatalogs && catalogError && (
                            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-700">
                                <p className="font-semibold">No fue posible cargar los catálogos necesarios para administrar productos.</p>
                                {catalogError}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            onChange={() => {
                                setFormError(null);
                                setInvalidField(null);
                                setSuccessMessage(null);
                            }}
                            className="mt-7"
                        >
                            <fieldset disabled={isSubmitting} className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
                                <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3">
                                    <span className="text-xs font-semibold text-sky-700" aria-hidden="true">01</span>
                                    <h3 className="text-sm font-semibold text-slate-800">Información general</h3>
                                </div>
                                <div>
                                    <label htmlFor="product-category" className="block text-sm font-medium text-slate-700">
                                        Categoría
                                    </label>

                                    <select
                                        id="product-category"
                                        aria-invalid={invalidField === "category"}
                                        aria-describedby={invalidField === "category" ? "product-form-error" : undefined}
                                        aria-required="true"
                                        value={
                                            categoryId
                                        }
                                        onChange={(event) =>
                                            setCategoryId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loadingCategories ||
                                            isSubmitting
                                        }
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            {loadingCategories ? "Cargando categorías..." : "Selecciona..."}
                                        </option>

                                        {activeCategories
                                            .map(
                                                (
                                                    category
                                                ) => (
                                                    <option
                                                        key={
                                                            category.id
                                                        }
                                                        value={
                                                            category.id
                                                        }
                                                    >
                                                        {
                                                            category.name
                                                        }
                                                    </option>
                                                )
                                            )}
                                    </select>
                                    {!loadingCategories && !categoriesError && activeCategories.length === 0 && (
                                        <p role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm leading-6 text-amber-800">Primero registra una categoría activa para poder crear productos.</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="product-name" className="block text-sm font-medium text-slate-700">
                                        Nombre
                                    </label>

                                    <input
                                        id="product-name"
                                        aria-invalid={invalidField === "name" || Boolean(duplicateProduct)}
                                        aria-describedby={duplicateProduct ? "product-duplicate-warning" : invalidField === "name" ? "product-form-error" : undefined}
                                        aria-required="true"
                                        autoComplete="off"
                                        value={name}
                                        onChange={(event) =>
                                            setName(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej. Taladro inalámbrico"
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                    {duplicateProduct && (
                                        <p id="product-duplicate-warning" role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm leading-6 text-amber-800">
                                            Ya existe un producto con este nombre, categoría, características y unidad: <span className="font-semibold">{duplicateProduct.name} ({duplicateProduct.sku})</span>. Revisa talla, color, modelo y especificación si deseas registrar otra variante.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="product-stock-unit" className="block text-sm font-medium text-slate-700">
                                        Unidad de inventario
                                    </label>

                                    <select
                                        id="product-stock-unit"
                                        aria-invalid={invalidField === "stock-unit"}
                                        aria-describedby={invalidField === "stock-unit" ? "product-form-error" : undefined}
                                        aria-required="true"
                                        value={stockUnitId}
                                        onChange={(event) =>
                                            setStockUnitId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loadingUnits ||
                                            Boolean(unitsError) ||
                                            isSubmitting
                                        }
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            {loadingUnits
                                                ? "Cargando unidades..."
                                                : "Selecciona..."}
                                        </option>

                                        {activeUnits
                                            .slice()
                                            .sort((first, second) =>
                                                first.name.localeCompare(
                                                    second.name,
                                                    "es"
                                                )
                                            )
                                            .map((unit) => (
                                                <option
                                                    key={unit.id}
                                                    value={unit.id}
                                                >
                                                    {unit.name}
                                                    {unit.symbol
                                                        ? ` (${unit.symbol})`
                                                        : ""}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3 pt-3">
                                    <span className="text-xs font-semibold text-sky-700" aria-hidden="true">02</span>
                                    <h3 className="text-sm font-semibold text-slate-800">Características y variantes</h3>
                                </div>
                                <div>
                                    <label htmlFor="product-size" className="block text-sm font-medium text-slate-700">
                                        Talla / tamaño
                                    </label>

                                    <select
                                        id="product-size"
                                        aria-invalid={invalidField === "size"}
                                        aria-describedby={invalidField === "size" ? "product-form-error" : undefined}
                                        value={sizeId}
                                        onChange={(event) =>
                                            setSizeId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loadingSizes ||
                                            Boolean(sizesError) ||
                                            isSubmitting
                                        }
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            {loadingSizes
                                                ? "Cargando tallas..."
                                                : "Sin talla"}
                                        </option>

                                        {activeSizes
                                            .slice()
                                            .sort((first, second) =>
                                                first.name.localeCompare(
                                                    second.name,
                                                    "es",
                                                    {
                                                        numeric: true,
                                                        sensitivity: "base",
                                                    }
                                                )
                                            )
                                            .map((size) => (
                                                <option
                                                    key={size.id}
                                                    value={size.id}
                                                >
                                                    {size.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="product-color" className="block text-sm font-medium text-slate-700">
                                        Color
                                    </label>

                                    <select
                                        id="product-color"
                                        aria-invalid={invalidField === "color"}
                                        aria-describedby={invalidField === "color" ? "product-form-error" : undefined}
                                        value={colorId}
                                        onChange={(event) =>
                                            setColorId(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loadingColors ||
                                            Boolean(colorsError) ||
                                            isSubmitting
                                        }
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            {loadingColors
                                                ? "Cargando colores..."
                                                : "Sin color"}
                                        </option>

                                        {activeColors
                                            .slice()
                                            .sort((first, second) =>
                                                first.name.localeCompare(
                                                    second.name,
                                                    "es",
                                                    {
                                                        sensitivity: "base",
                                                    }
                                                )
                                            )
                                            .map((color) => (
                                                <option
                                                    key={color.id}
                                                    value={color.id}
                                                >
                                                    {color.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="product-model" className="block text-sm font-medium text-slate-700">
                                        Modelo
                                    </label>

                                    <input
                                        id="product-model"
                                        autoComplete="off"
                                        value={model}
                                        onChange={(event) =>
                                            setModel(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej. M-200"
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                </div>

                                <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3 pt-3">
                                    <span className="text-xs font-semibold text-sky-700" aria-hidden="true">03</span>
                                    <h3 className="text-sm font-semibold text-slate-800">Control de inventario</h3>
                                </div>
                                <div>
                                    <label htmlFor="product-minimum-stock" className="block text-sm font-medium text-slate-700">
                                        Stock mínimo
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        id="product-minimum-stock"
                                        aria-invalid={invalidField === "minimum-stock"}
                                        aria-describedby={invalidField === "minimum-stock" ? "product-form-error" : undefined}
                                        value={
                                            minimumStock
                                        }
                                        onChange={(event) =>
                                            setMinimumStock(
                                                event.target.value
                                            )
                                        }
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="product-max-cycle" className="block text-sm font-medium text-slate-700">
                                        Máximo por ciclo <span className="text-xs font-normal text-slate-500">(opcional)</span>
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        id="product-max-cycle"
                                        aria-invalid={invalidField === "max-cycle"}
                                        aria-describedby={invalidField === "max-cycle" ? "product-form-error" : undefined}
                                        value={
                                            defaultMaxQuantityPerCycle
                                        }

                                        onChange={(event) =>
                                            setDefaultMaxQuantityPerCycle(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej. 10"
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="product-replacement-days" className="block text-sm font-medium text-slate-700">
                                        Reemplazo cada <span className="text-xs font-normal text-slate-500">(opcional)</span>
                                    </label>

                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            id="product-replacement-days"
                                            aria-invalid={invalidField === "replacement-days"}
                                            aria-describedby={invalidField === "replacement-days" ? "product-form-error" : undefined}
                                            value={
                                                replacementIntervalDays
                                            }
                                            onChange={(event) =>
                                                setReplacementIntervalDays(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Ej. 10"
                                            className="w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                        />

                                        <span className="text-sm text-slate-500">
                                            días
                                        </span>
                                    </div>
                                </div>

                                <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3 pt-3">
                                    <span className="text-xs font-semibold text-sky-700" aria-hidden="true">04</span>
                                    <h3 className="text-sm font-semibold text-slate-800">Detalles del producto</h3>
                                </div>
                                <div className="md:col-span-2 xl:col-span-3">
                                    <label htmlFor="product-specification" className="block text-sm font-medium text-slate-700">
                                        Especificación
                                    </label>

                                    <input
                                        id="product-specification"
                                        autoComplete="off"
                                        value={
                                            specification
                                        }
                                        onChange={(event) =>
                                            setSpecification(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej. Acero inoxidable, 20 V o capacidad de 5 L"
                                        className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                </div>

                                <div className="md:col-span-2 xl:col-span-3">
                                    <label htmlFor="product-description" className="block text-sm font-medium text-slate-700">
                                        Descripción
                                    </label>

                                    <textarea
                                        rows={3}
                                        id="product-description"
                                        autoComplete="off"
                                        value={
                                            description
                                        }
                                        onChange={(event) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Aquí puedes describir el producto con más detalle"
                                        className="mt-2 resize-y w-full min-w-0 rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                    />
                                </div>

                                {formError && (
                                    <div id="product-form-error" role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 md:col-span-2 xl:col-span-3">
                                        {formError}
                                    </div>
                                )}

                                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 md:col-span-2 xl:col-span-3">
                                    {editingProductId !== null && (
                                        <button
                                            type="button"
                                            onClick={
                                                cancelEditing
                                            }
                                            disabled={
                                                isSubmitting
                                            }
                                            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                                        >
                                            Cancelar
                                        </button>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            loading ||
                                            loadingCatalogs ||
                                            Boolean(catalogError) ||
                                            activeCategories.length === 0 ||
                                            activeUnits.length === 0 ||
                                            Boolean(duplicateProduct)
                                        }
                                        className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                    >
                                        {isSubmitting
                                            ? "Guardando..."
                                            : editingProductId !== null
                                                ? "Guardar cambios"
                                                : "Crear producto"}
                                    </button>
                                </div>
                            </fieldset>
                        </form>
                    </section>
                )}

            </div>

            {supplierAssignmentProducts && isAdministrator && (
                <ProductSupplierAssignmentModal
                    products={supplierAssignmentProducts}
                    suppliers={suppliers}
                    units={activeUnits}
                    catalogsReady={suppliersLoaded && unitsLoaded}
                    catalogsLoading={loadingSuppliers || loadingUnits}
                    catalogsError={suppliersError || unitsError}
                    loadCatalogs={loadSupplierCatalogs}
                    supplierId={assignmentSupplierId}
                    onSelectSupplier={(id) => {
                        setAssignmentSupplierId(id);
                        if (id !== null) void supplierRelations.loadSupplierProducts(id);
                    }}
                    relations={supplierRelations}
                    onClose={() => {
                        setSupplierAssignmentProducts(null);
                        setAssignmentSupplierId(null);
                    }}
                />
            )}

            <ProductWarehouseAssignmentModal
                open={
                    warehouseAssignmentOpen
                }
                products={
                    products
                }
                selectedProductIds={
                    assignmentProductIds
                }
                warehouses={
                    warehouses
                }
                loadingWarehouses={
                    loadingWarehouses
                }
                warehousesError={
                    warehousesError
                }
                warehousesLoaded={
                    warehousesLoaded
                }
                loadWarehouses={
                    refreshWarehouses
                }
                onClose={
                    closeWarehouseAssignment
                }
                onAssigned={
                    handleWarehouseAssignmentSuccess
                }
            />

        </div>
    );
};
