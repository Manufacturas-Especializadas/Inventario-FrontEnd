import {
    useMemo,
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
    getApiErrorMessage,
} from "../utils/utils";
import {
    useUnits,
} from "../hooks/useUnits";
import {
    useSizes,
} from "../hooks/useSizes";

type StatusFilter = "all" | "active" | "inactive";
type ProductFormField =
    | "category"
    | "name"
    | "size"
    | "stock-unit"
    | "minimum-stock"
    | "max-cycle"
    | "replacement-days";
const normalizeProductText = (value: string | null) =>
    (value ?? "").trim().toLocaleLowerCase("es");

export const PPEProductsPage = () => {
    const {
        products,
        loading,
        error,
        refresh,
    } = usePPEProducts();

    const {
        categories,
        loading:
        loadingCategories,
        error: categoriesError,
    } = usePPECategories();

    const {
        activeUnits,
        loading: loadingUnits,
        error: unitsError,
    } = useUnits();

    const {
        activeSizes,
        loading: loadingSizes,
        error: sizesError,
    } = useSizes();

    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole(
            "Administrator"
        );

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
        color,
        setColor,
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

    const activeCategories = useMemo(() => categories
        .filter((category) => category.isActive)
        .sort((first, second) => first.name.localeCompare(second.name, "es")), [categories]);

    // Usa las categorías de los productos para incluir también las inactivas.
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

    const duplicateProduct = useMemo(() => {
        if (!categoryId || !name.trim()) {
            return undefined;
        }

        const selectedSizeId =
            sizeId
                ? Number(sizeId)
                : null;

        return products.find(
            (product) =>
                product.categoryId ===
                Number(categoryId) &&

                normalizeProductText(product.name) ===
                normalizeProductText(name) &&

                product.sizeId ===
                selectedSizeId &&

                normalizeProductText(product.color) ===
                normalizeProductText(color) &&

                normalizeProductText(product.model) ===
                normalizeProductText(model) &&

                normalizeProductText(product.specification) ===
                normalizeProductText(specification) &&

                product.stockUnitId ===
                Number(stockUnitId)
        );
    }, [
        products,
        categoryId,
        name,
        sizeId,
        color,
        model,
        specification,
        stockUnitId,
    ]);
    const hasFilters = search.length > 0 || statusFilter !== "all" || categoryFilter !== "";

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setCategoryFilter("");
        setSuccessMessage(null);
    };

    const reportFormError = (field: ProductFormField, message: string) => {
        setInvalidField(field);
        setFormError(message);
    };

    const resetForm = () => {
        setCategoryId("");
        setName("");
        setDescription("");
        setSizeId("");
        setColor("");
        setModel("");
        setSpecification("");
        setStockUnitId("");
        setMinimumStock("0");
        setDefaultMaxQuantityPerCycle("");
        setReplacementIntervalDays("");
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (!isAdministrator || isSubmitting || loading || loadingCategories || categoriesError) {
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

            if (!stockUnitId) {
                setFormError(
                    "Selecciona una unidad de inventario."
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
                const createdProduct = await ppeProductsService
                    .create({
                        categoryId:
                            Number(
                                categoryId
                            ),

                        name:
                            name.trim(),

                        description:
                            description.trim() ||
                            null,

                        sizeId:
                            sizeId
                                ? Number(sizeId)
                                : null,

                        color:
                            color.trim() ||
                            null,

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
                    });

                resetForm();
                clearFilters();

                await refresh();
                setSuccessMessage(`Producto "${createdProduct.name}" (${createdProduct.sku}) creado correctamente.`);
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible crear el producto."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Catálogos
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Productos de inventario
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Un catálogo organizado para los artículos, materiales y recursos de MESA.
                </p>
            </div>

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5" /></svg>
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Nuevo producto
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">Define sus características y los parámetros de inventario.</p>
                        </div>
                    </div>

                    {successMessage && !formError && (
                        <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                            {successMessage}
                        </div>
                    )}

                    {!loadingCategories && categoriesError && (
                        <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            <p className="font-semibold">No fue posible cargar las categorías para registrar productos.</p>
                            {categoriesError}
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                    <p role="status" className="mt-2 text-sm leading-6 text-amber-800">Primero registra una categoría activa para poder crear productos.</p>
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                                {duplicateProduct && (
                                    <p id="product-duplicate-warning" role="status" className="mt-2 text-sm leading-6 text-amber-800">
                                        Ya existe un producto con este nombre, categoría, características y unidad: <span className="font-semibold">{duplicateProduct.name} ({duplicateProduct.sku})</span>. Revisa talla, color, modelo y especificación si deseas registrar otra variante.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Unidad de inventario
                                </label>

                                <select
                                    value={stockUnitId}
                                    onChange={(event) =>
                                        setStockUnitId(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loadingUnits ||
                                        isSubmitting
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        {loadingUnits
                                            ? "Cargando unidades..."
                                            : "Selecciona..."}
                                    </option>

                                    {activeUnits.map(
                                        (unit) => (
                                            <option
                                                key={unit.id}
                                                value={unit.id}
                                            >
                                                {unit.name}
                                                {unit.symbol
                                                    ? ` (${unit.symbol})`
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>

                                {unitsError && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {unitsError}
                                    </p>
                                )}
                            </div>

                            <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3 pt-3">
                                <span className="text-xs font-semibold text-sky-700" aria-hidden="true">02</span>
                                <h3 className="text-sm font-semibold text-slate-800">Características y variantes</h3>
                            </div>
                            <div>
                                <label
                                    htmlFor="product-size"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Talla / tamaño
                                </label>

                                <select
                                    id="product-size"
                                    aria-invalid={
                                        invalidField === "size"
                                    }
                                    aria-describedby={
                                        invalidField === "size"
                                            ? "product-form-error"
                                            : undefined
                                    }
                                    value={sizeId}
                                    onChange={(event) =>
                                        setSizeId(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loadingSizes ||
                                        isSubmitting
                                    }
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        {loadingSizes
                                            ? "Cargando tallas..."
                                            : "Sin talla"}
                                    </option>

                                    {activeSizes.map(
                                        (size) => (
                                            <option
                                                key={size.id}
                                                value={size.id}
                                            >
                                                {size.name}
                                            </option>
                                        )
                                    )}
                                </select>

                                {sizesError && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {sizesError}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="product-color" className="block text-sm font-medium text-slate-700">
                                    Color
                                </label>

                                <input
                                    id="product-color"
                                    autoComplete="off"
                                    value={color}
                                    onChange={(event) =>
                                        setColor(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ej. Azul"
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                        className="w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                    className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                                    className="mt-2 resize-y w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                            </div>

                            {formError && (
                                <div id="product-form-error" role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2 xl:col-span-3">
                                    {formError}
                                </div>
                            )}

                            <div className="flex justify-end border-t border-slate-100 pt-5 md:col-span-2 xl:col-span-3">
                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting || loading || loadingCategories || Boolean(categoriesError) ||
                                        activeCategories.length === 0 || Boolean(duplicateProduct)
                                    }
                                    className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                >
                                    {isSubmitting
                                        ? "Guardando..."
                                        : "Crear producto"}
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </section>
            )}

            <dl aria-label="Resumen de productos" aria-busy={loading} className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Total de productos", value: summary.total },
                    { label: "Productos activos", value: summary.active },
                    { label: "Productos inactivos", value: summary.inactive },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                        <dt className="text-sm font-medium text-slate-600">{item.label}</dt>
                        <dd className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">{loading ? "…" : error ? "—" : item.value}</dd>
                    </div>
                ))}
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Productos registrados
                        </h2>
                        {!loading && !error && (
                            <p role="status" aria-atomic="true" className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tabular-nums text-sky-800 ring-1 ring-inset ring-sky-200">
                                {filteredProducts.length} {filteredProducts.length === 1 ? "resultado" : "resultados"}
                            </p>
                        )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Consulta las variantes, la clasificación y el stock mínimo de tus artículos.</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
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

                {loading && (
                    <div role="status" className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        Cargando productos...
                    </div>
                )}

                {!loading &&
                    error && (
                        <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {successMessage && <p className="mb-1 font-semibold">El producto se creó, pero no se pudo actualizar el listado.</p>}
                            {error}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    products.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9" /></svg>
                            <p className="text-sm font-semibold text-slate-900">Aún no hay productos registrados</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Los artículos aparecerán aquí cuando se agreguen al catálogo.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    products.length > 0 && filteredProducts.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">No encontramos coincidencias.</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Prueba con otro término o elimina los filtros.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredProducts.length > 0 && (
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Productos registrados">
                            <table className="w-full min-w-200 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
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

                                        <th className="px-5 py-3">
                                            Unidad
                                        </th>

                                        <th scope="col" className="px-5 py-3 text-right">
                                            Mínimo
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Estado
                                        </th>
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

                                                <td className="px-5 py-4 text-slate-600">
                                                    {product.stockUnit}

                                                    {product.stockUnitSymbol && (
                                                        <span className="ml-1 text-xs text-slate-400">
                                                            ({product.stockUnitSymbol})
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right text-slate-700">
                                                    {
                                                        product.minimumStock
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${product.isActive
                                                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                            : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {product.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>
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
};
