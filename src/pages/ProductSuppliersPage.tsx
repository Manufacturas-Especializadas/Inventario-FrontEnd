import {
    useState,
    type FormEvent,
} from "react";

import {
    productSuppliersService,
} from "../api/services/ProductSuppliersService";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import {
    useProductSuppliers,
} from "../hooks/useProductSuppliers";

import {
    useSuppliers,
} from "../hooks/useSuppliers";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const ProductSuppliersPage = () => {
    const {
        products,
        loading: loadingProducts,
    } = usePPEProducts();

    const {
        suppliers,
        loading: loadingSuppliers,
    } = useSuppliers();

    const [
        ppeProductId,
        setPPEProductId,
    ] = useState("");

    const [
        supplierId,
        setSupplierId,
    ] = useState("");

    const [
        supplierProductCode,
        setSupplierProductCode,
    ] = useState("");

    const [
        purchaseUnit,
        setPurchaseUnit,
    ] = useState("Caja");

    const [
        unitsPerPackage,
        setUnitsPerPackage,
    ] = useState("1");

    const [
        packageBarcode,
        setPackageBarcode,
    ] = useState("");

    const [
        isPreferred,
        setIsPreferred,
    ] = useState(false);

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const selectedProductId = ppeProductId ? Number(ppeProductId) : null;

    const {
        productSuppliers,
        loading,
        error,
        refresh,
    } = useProductSuppliers(
        selectedProductId
    );

    const resetForm = () => {
        setPPEProductId("");
        setSupplierId("");
        setSupplierProductCode("");
        setPurchaseUnit("Caja");
        setUnitsPerPackage("1");
        setPackageBarcode("");
        setIsPreferred(false);
    };

    const getProductName = (
        productId: number
    ) => {
        const product =
            products.find(
                (product) =>
                    product.id === productId
            );

        if (!product) {
            return `Producto #${productId}`;
        }

        return `${product.sku} - ${product.name}`;
    };

    const getSupplierName = (
        currentSupplierId: number
    ) => {
        return (
            suppliers.find(
                (supplier) =>
                    supplier.id ===
                    currentSupplierId
            )?.name ??
            `Proveedor #${currentSupplierId}`
        );
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);

            if (!ppeProductId) {
                setFormError(
                    "Selecciona un producto EPP."
                );

                return;
            }

            if (!supplierId) {
                setFormError(
                    "Selecciona un proveedor."
                );

                return;
            }

            if (!purchaseUnit.trim()) {
                setFormError(
                    "La unidad de compra es obligatoria."
                );

                return;
            }

            const parsedUnits =
                Number(unitsPerPackage);

            if (
                !Number.isInteger(parsedUnits) ||
                parsedUnits <= 0
            ) {
                setFormError(
                    "Las unidades por paquete deben ser un número entero mayor a cero."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await productSuppliersService
                    .create({
                        ppeProductId:
                            Number(
                                ppeProductId
                            ),

                        supplierId:
                            Number(
                                supplierId
                            ),

                        supplierProductCode:
                            supplierProductCode
                                .trim() ||
                            null,

                        purchaseUnit:
                            purchaseUnit.trim(),

                        unitsPerPackage:
                            parsedUnits,

                        packageBarcode:
                            packageBarcode
                                .trim() ||
                            null,

                        isPreferred,
                    });

                resetForm();

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible asociar el proveedor con el producto."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const catalogsLoading =
        loadingProducts ||
        loadingSuppliers;

    return (
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Catálogos
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Productos por proveedor
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Configura qué proveedor
                    suministra cada producto EPP y
                    cómo se compra o recibe.
                </p>
            </div>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    Nueva relación
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Producto EPP
                        </label>

                        <select
                            value={ppeProductId}
                            onChange={(event) =>
                                setPPEProductId(
                                    event.target.value
                                )
                            }
                            disabled={
                                catalogsLoading ||
                                isSubmitting
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                Selecciona...
                            </option>

                            {products
                                .filter(
                                    (product) =>
                                        product.isActive
                                )
                                .map(
                                    (product) => (
                                        <option
                                            key={
                                                product.id
                                            }
                                            value={
                                                product.id
                                            }
                                        >
                                            {product.sku} -{" "}
                                            {product.name}
                                        </option>
                                    )
                                )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Proveedor
                        </label>

                        <select
                            value={supplierId}
                            onChange={(event) =>
                                setSupplierId(
                                    event.target.value
                                )
                            }
                            disabled={
                                catalogsLoading ||
                                isSubmitting
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                Selecciona...
                            </option>

                            {suppliers
                                .filter(
                                    (supplier) =>
                                        supplier.isActive
                                )
                                .map(
                                    (supplier) => (
                                        <option
                                            key={
                                                supplier.id
                                            }
                                            value={
                                                supplier.id
                                            }
                                        >
                                            {
                                                supplier.name
                                            }
                                        </option>
                                    )
                                )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Código del proveedor
                        </label>

                        <input
                            type="text"
                            value={
                                supplierProductCode
                            }
                            onChange={(event) =>
                                setSupplierProductCode(
                                    event.target.value
                                )
                            }
                            placeholder="Ej. GUA-AC-L"
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Unidad de compra
                        </label>

                        <select
                            value={purchaseUnit}
                            onChange={(event) =>
                                setPurchaseUnit(
                                    event.target.value
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        >
                            <option value="Caja">
                                Caja
                            </option>

                            <option value="Paquete">
                                Paquete
                            </option>

                            <option value="Pieza">
                                Pieza
                            </option>

                            <option value="Par">
                                Par
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Unidades por paquete
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                                unitsPerPackage
                            }
                            onChange={(event) =>
                                setUnitsPerPackage(
                                    event.target.value
                                )
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Código de barras
                        </label>

                        <input
                            type="text"
                            value={
                                packageBarcode
                            }
                            onChange={(event) =>
                                setPackageBarcode(
                                    event.target.value
                                )
                            }
                            placeholder="Opcional"
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2 xl:col-span-3">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    isPreferred
                                }
                                onChange={(event) =>
                                    setIsPreferred(
                                        event.target
                                            .checked
                                    )
                                }
                                className="h-4 w-4"
                            />

                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Proveedor preferido
                                </p>

                                <p className="text-xs text-slate-500">
                                    Será la opción
                                    principal para
                                    comprar este
                                    producto.
                                </p>
                            </div>
                        </label>
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
                                catalogsLoading ||
                                isSubmitting
                            }
                            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : "Asociar proveedor"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Relaciones registradas
                        </h2>

                        {!loading && !error && (
                            <p className="mt-1 text-xs text-slate-500">
                                {
                                    productSuppliers.length
                                }{" "}
                                relaciones
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void refresh()
                        }
                        disabled={loading}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando relaciones...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    productSuppliers.length ===
                    0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay relaciones
                            producto-proveedor
                            registradas.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    productSuppliers.length >
                    0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">
                                            Producto
                                        </th>

                                        <th className="px-5 py-3">
                                            Proveedor
                                        </th>

                                        <th className="px-5 py-3">
                                            Código
                                        </th>

                                        <th className="px-5 py-3">
                                            Compra
                                        </th>

                                        <th className="px-5 py-3">
                                            Contenido
                                        </th>

                                        <th className="px-5 py-3">
                                            Preferido
                                        </th>

                                        <th className="px-5 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {productSuppliers.map(
                                        (relation) => (
                                            <tr

                                                key={`${relation.ppeProductId}-${relation.supplierId}`}

                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 font-medium text-slate-900">
                                                    {getProductName(
                                                        relation.ppeProductId
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {getSupplierName(
                                                        relation.supplierId
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 font-mono text-xs">
                                                    {relation.supplierProductCode ??
                                                        "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        relation.purchaseUnit
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        relation.unitsPerPackage
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {relation.isPreferred
                                                        ? "Sí"
                                                        : "No"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${relation.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {relation.isActive
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