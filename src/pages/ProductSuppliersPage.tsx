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
import {
    useUnits,
} from "../hooks/useUnits";

export const ProductSuppliersPage = () => {
    const {
        products,
        loading: loadingProducts,
    } = usePPEProducts();

    const {
        suppliers,
        loading: loadingSuppliers,
    } = useSuppliers();

    const {
        activeUnits,
        loading: loadingUnits,
        error: unitsError,
    } = useUnits();

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
        purchaseUnitId,
        setPurchaseUnitId,
    ] = useState("");

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
        setPurchaseUnitId("");
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

    const getStockUnitName = (
        productId: number
    ) => {
        const product =
            products.find(
                (product) =>
                    product.id === productId
            );

        return product?.stockUnit ??
            "unidades";
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

            if (!purchaseUnitId) {
                setFormError(
                    "Selecciona una unidad de compra."
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

                        purchaseUnitId:
                            Number(purchaseUnitId),

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
        loadingSuppliers ||
        loadingUnits;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Catálogos
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Productos por proveedor
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Vincula tus productos con sus proveedores y define cómo se compran y reciben.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10 13 4-4M8 16l-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0M16 8l1-1a4.2 4.2 0 0 1 6 6l-4 4a4.2 4.2 0 0 1-6 0" transform="translate(0 -1)" /></svg>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Nueva relación
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Asocia un proveedor y configura la presentación de compra del producto.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
                >
                    <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3">
                        <span aria-hidden="true" className="text-xs font-semibold text-sky-700">01</span>
                        <h3 className="text-sm font-semibold text-slate-800">Producto y proveedor</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Producto
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
                            placeholder="Ej. ART-001"
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3 pt-3">
                        <span aria-hidden="true" className="text-xs font-semibold text-sky-700">02</span>
                        <h3 className="text-sm font-semibold text-slate-800">Compra y empaque</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Unidad de compra
                        </label>

                        <select
                            value={purchaseUnitId}
                            onChange={(event) =>
                                setPurchaseUnitId(
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
                        <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-sky-200 bg-sky-50/60 p-5 transition-colors hover:bg-sky-50 focus-within:ring-4 focus-within:ring-sky-100 motion-reduce:transition-none">
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
                                className="h-5 w-5 shrink-0 accent-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                            />

                            <span>
                                <span className="block text-sm font-semibold text-slate-800">
                                    Proveedor preferido
                                </span>

                                <span className="mt-1 block text-xs leading-5 text-slate-600">
                                    Será la opción
                                    principal para
                                    comprar este
                                    producto.
                                </span>
                            </span>
                        </label>
                    </div>

                    {formError && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2 xl:col-span-3">
                            {formError}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-5 md:col-span-2 xl:col-span-3">
                        <button
                            type="submit"
                            disabled={
                                catalogsLoading ||
                                isSubmitting
                            }
                            className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : "Asociar proveedor"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Relaciones registradas
                        </h2>

                        {!loading && !error && (
                            <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 enabled:active:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></svg>
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div role="status" className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        Cargando relaciones...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    productSuppliers.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">No hay relaciones registradas para esta consulta</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Utiliza el formulario superior para asociar un producto con su proveedor.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    productSuppliers.length >
                    0 && (
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Relaciones entre productos y proveedores">
                            <table className="w-full min-w-225 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
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

                                <tbody className="divide-y divide-slate-100">
                                    {productSuppliers.map(
                                        (relation) => (
                                            <tr

                                                key={`${relation.ppeProductId}-${relation.supplierId}`}

                                                className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
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
                                                    {relation.purchaseUnit}

                                                    {relation.purchaseUnitSymbol && (
                                                        <span className="ml-1 text-xs text-slate-400">
                                                            ({relation.purchaseUnitSymbol})
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {relation.unitsPerPackage}{" "}
                                                    {getStockUnitName(
                                                        relation.ppeProductId
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {relation.isPreferred
                                                        ? "Sí"
                                                        : "No"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${relation.isActive
                                                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                            : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
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
