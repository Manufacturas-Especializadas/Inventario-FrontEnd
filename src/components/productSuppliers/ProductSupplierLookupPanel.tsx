import type { PPEProduct, ProductSupplier } from "../../types/types";
import { CatalogLoadingSkeleton } from "../catalogs/CatalogLoadingSkeleton";

interface ProductSupplierLookupPanelProps {
    products: PPEProduct[];
    productsLoading: boolean;
    productsError: string | null;
    productsLoaded: boolean;
    onRetryProducts: () => void;
    selectedProductId: string;
    onProductChange: (value: string) => void;
    productSuppliers: ProductSupplier[];
    loading: boolean;
    error: string | null;
    hasLoaded: boolean;
    onLoad: () => void;
    onRefresh: () => void;
}

const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 enabled:active:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export const ProductSupplierLookupPanel = ({
    products, productsLoading, productsError, productsLoaded, onRetryProducts,
    selectedProductId, onProductChange, productSuppliers, loading, error,
    hasLoaded, onLoad, onRefresh,
}: ProductSupplierLookupPanelProps) => (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
        <div className="space-y-4 border-b border-slate-200 px-6 py-6 sm:px-8">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Consultar relaciones</h2>
            {productsLoading ? <CatalogLoadingSkeleton label="Cargando productos..." /> : productsError ? (
                <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    <p>{productsError}</p>
                    <button type="button" onClick={onRetryProducts} className={buttonClass}>Reintentar</button>
                </div>
            ) : productsLoaded && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                        <label htmlFor="lookup-product" className="block text-sm font-medium text-slate-700">Producto</label>
                        <select id="lookup-product" value={selectedProductId} onChange={(event) => onProductChange(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm">
                            <option value="">Selecciona...</option>
                            {products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={onLoad} disabled={!selectedProductId || loading} className={buttonClass}>Obtener relaciones</button>
                    <button type="button" onClick={onRefresh} disabled={!selectedProductId || loading} className={buttonClass}>Actualizar</button>
                </div>
            )}
        </div>
        {loading ? <CatalogLoadingSkeleton label="Cargando relaciones..." /> : error ? (
            <div role="alert" className="m-6 space-y-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <p>{error}</p>
                <button type="button" onClick={onRefresh} className={buttonClass}>Reintentar</button>
            </div>
        ) : hasLoaded ? (
            <>
                <p className="m-6 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">{productSuppliers.length} relaciones</p>
                {productSuppliers.length === 0 ? (
                    <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-900">No hay relaciones registradas para esta consulta</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Utiliza el formulario superior para asociar un producto con su proveedor.</p>
                    </div>
                ) : (
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
                                                {relation.sku} - {relation.productName}
                                            </td>

                                            <td className="px-5 py-4">
                                                {relation.supplierName}
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
                                                {relation.stockUnit}
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
            </>
        ) : productsLoaded && !productsLoading && !productsError && (
            <p className="px-6 py-8 text-sm text-slate-600 sm:px-8">
                {products.length === 0 ? "No hay productos disponibles para consultar." : selectedProductId ? "Pulsa Obtener relaciones para consultar este producto." : "Selecciona un producto para consultar sus relaciones."}
            </p>
        )}
    </section>
);
