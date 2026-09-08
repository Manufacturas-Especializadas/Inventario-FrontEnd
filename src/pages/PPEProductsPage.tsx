import {
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
    } = usePPECategories();

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
        size,
        setSize,
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
        stockUnit,
        setStockUnit,
    ] = useState("Pieza");

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

    const resetForm = () => {
        setCategoryId("");
        setName("");
        setDescription("");
        setSize("");
        setColor("");
        setModel("");
        setSpecification("");
        setStockUnit("Pieza");
        setMinimumStock("0");
        setDefaultMaxQuantityPerCycle("");
        setReplacementIntervalDays("");
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);

            if (!categoryId) {
                setFormError(
                    "Selecciona una categoría."
                );

                return;
            }

            if (!name.trim()) {
                setFormError(
                    "El nombre del producto es obligatorio."
                );

                return;
            }

            if (!stockUnit.trim()) {
                setFormError(
                    "La unidad de inventario es obligatoria."
                );

                return;
            }

            const minimum =
                Number(
                    minimumStock
                );

            if (
                Number.isNaN(
                    minimum
                ) ||
                minimum < 0
            ) {
                setFormError(
                    "El stock mínimo debe ser igual o mayor a cero."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await ppeProductsService
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

                        size:
                            size.trim() ||
                            null,

                        color:
                            color.trim() ||
                            null,

                        model:
                            model.trim() ||
                            null,

                        specification:
                            specification.trim() ||
                            null,

                        stockUnit:
                            stockUnit.trim(),

                        minimumStock:
                            minimum,

                        defaultMaxQuantityPerCycle:
                            defaultMaxQuantityPerCycle
                                ? Number(defaultMaxQuantityPerCycle)
                                : null,

                        replacementIntervalDays:
                            replacementIntervalDays
                                ? Number(
                                    replacementIntervalDays
                                )
                                : null,
                    });

                resetForm();

                await refresh();
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
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Catálogos
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Productos EPP
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Catálogo de equipos y variantes controladas en inventario.
                </p>
            </div>

            {isAdministrator && (
                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Nuevo producto
                    </h2>

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                    >
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Categoría
                            </label>

                            <select
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
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="">
                                    Selecciona...
                                </option>

                                {categories
                                    .filter(
                                        (
                                            category
                                        ) =>
                                            category.isActive
                                    )
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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Nombre
                            </label>

                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. Lentes de seguridad"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Unidad de inventario (Pieza, par, etc)
                            </label>

                            <input
                                value={
                                    stockUnit
                                }
                                onChange={(event) =>
                                    setStockUnit(
                                        event.target.value
                                    )
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Talla
                            </label>

                            <input
                                value={size}
                                onChange={(event) =>
                                    setSize(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. M, L, 10"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Color
                            </label>

                            <input
                                value={color}
                                onChange={(event) =>
                                    setColor(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. Transparente"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Modelo
                            </label>

                            <input
                                value={model}
                                onChange={(event) =>
                                    setModel(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. M-200"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Stock mínimo
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={
                                    minimumStock
                                }
                                onChange={(event) =>
                                    setMinimumStock(
                                        event.target.value
                                    )
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Cantidad Máximo por ciclo (Opcional)
                            </label>

                            <input
                                type="number"
                                min="1"
                                value={
                                    defaultMaxQuantityPerCycle
                                }

                                onChange={(event) =>
                                    setDefaultMaxQuantityPerCycle(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. 10"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Reemplazo cada (Opcional)
                            </label>

                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        replacementIntervalDays
                                    }
                                    onChange={(event) =>
                                        setReplacementIntervalDays(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ej. 10"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />

                                <span className="text-sm text-slate-500">
                                    días
                                </span>
                            </div>
                        </div>

                        <div className="md:col-span-2 xl:col-span-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Especificación
                            </label>

                            <input
                                value={
                                    specification
                                }
                                onChange={(event) =>
                                    setSpecification(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. ANSI Z87.1"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div className="md:col-span-2 xl:col-span-3">
                            <label className="block text-sm font-medium text-slate-700">
                                Descripción
                            </label>

                            <textarea
                                rows={3}
                                value={
                                    description
                                }
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="Aquí puedes describir el producto con más detalle"
                                className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        {formError && (
                            <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        <div className="md:col-span-2 xl:col-span-3">
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting
                                }
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : "Crear producto"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="font-semibold text-slate-900">
                        Productos registrados
                    </h2>
                </div>

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando productos...
                    </div>
                )}

                {!loading &&
                    error && (
                        <div className="p-6 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    products.length ===
                    0 && (
                        <div className="p-6 text-sm text-slate-500">
                            No hay productos registrados.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    products.length >
                    0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">
                                            SKU
                                        </th>

                                        <th className="px-5 py-3">
                                            Producto
                                        </th>

                                        <th className="px-5 py-3">
                                            Categoría
                                        </th>

                                        <th className="px-5 py-3">
                                            Variante
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Mínimo
                                        </th>

                                        <th className="px-5 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {products.map(
                                        (
                                            product
                                        ) => (
                                            <tr
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
                                                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
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
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
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