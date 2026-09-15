import {
    useMemo,
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
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

import { PageHeader } from "../components/ui/PageHeader";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";
import { ProductsCatalogPanel } from "../components/products/ProductsCatalogPanel";
import { normalizeProductText } from "../utils/productText";

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
    } = usePPECategories();

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
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole(
            "Administrator"
        );

    const [showForm, setShowForm] = useState(false);
    const [showProducts, setShowProducts] = useState(false);
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

    const toggleProducts = () => {
        const nextOpen = !showProducts;
        setShowProducts(nextOpen);
        if (nextOpen && !hasLoaded) void refresh();
    };

    const [
        categoryId,
        setCategoryId,
    ] = useState("");

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

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
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
                        {showForm ? "Ocultar formulario" : editingProductId !== null ? "Mostrar edición" : "Nuevo producto"}
                        <svg aria-hidden="true" className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${showForm ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                )}
                <button
                    type="button"
                    onClick={toggleProducts}
                    aria-expanded={showProducts}
                    aria-controls="products-list-panel"
                    className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                >
                    {showProducts ? "Ocultar listado" : "Ver listado de productos"}
                    <svg aria-hidden="true" className={`h-5 w-5 transition-transform duration-300 motion-reduce:transition-none ${showProducts ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>

            {isAdministrator && successMessage && !formError && (
                <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800">
                    {successMessage}
                </div>
            )}

            <div id="products-form-panel" hidden={!isAdministrator || !showForm}>
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

            <div id="products-list-panel" hidden={!showProducts}>
                {showProducts && (
                    loading ? <CatalogLoadingSkeleton label="Cargando productos" />
                        : error ? (
                            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                                <p>{error}</p>
                                <button type="button" onClick={() => void refresh()} className="mt-4 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 font-semibold transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none">Reintentar</button>
                            </div>
                        ) : hasLoaded && (
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
                            />
                        )
                )}
            </div>
        </div>
    );
};
