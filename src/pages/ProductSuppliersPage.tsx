import {
    useState,
    useRef,
    type FormEvent,
} from "react";

import {
    productSuppliersService,
} from "../api/services/ProductSuppliersService";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import {
    useSuppliers,
} from "../hooks/useSuppliers";

import {
    getApiErrorMessage,
} from "../utils/utils";
import {
    useUnits,
} from "../hooks/useUnits";

import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";

import { PageHeader } from "../components/ui/PageHeader";

export const ProductSuppliersPage = () => {
    const {
        products,
        loading: loadingProducts,
        hasLoaded: productsLoaded,
        error: productsError,
        refresh: loadProducts,
    } = usePPEProducts({ autoLoad: false });

    const {
        suppliers,
        loading: loadingSuppliers,
        hasLoaded: suppliersLoaded,
        error: suppliersError,
        refresh: loadSuppliers,
    } = useSuppliers({ autoLoad: false });

    const {
        activeUnits,
        loading: loadingUnits,
        error: unitsError,
        hasLoaded: unitsLoaded,
        refresh: loadUnits,
    } = useUnits({ autoLoad: false });

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

    const [showForm, setShowForm] = useState(false);
    const submittingRef = useRef(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const loadFormCatalogs = () => Promise.all([
        !productsLoaded ? loadProducts() : Promise.resolve(),
        !suppliersLoaded ? loadSuppliers() : Promise.resolve(),
        !unitsLoaded ? loadUnits() : Promise.resolve(),
    ]);

    const toggleForm = () => {
        if (submittingRef.current) return;
        if (!showForm) void loadFormCatalogs();
        setShowForm(!showForm);
    };

    const resetForm = () => {
        setPPEProductId("");
        setSupplierId("");
        setSupplierProductCode("");
        setPurchaseUnitId("");
        setUnitsPerPackage("1");
        setPackageBarcode("");
        setIsPreferred(false);
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();
            if (submittingRef.current || !catalogsReady || catalogsLoading || catalogsError) return;
            setSuccessMessage(null);

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

            submittingRef.current = true;
            setIsSubmitting(true);

            const createdProductId = Number(ppeProductId);

            try {
                await productSuppliersService
                    .create({
                        ppeProductId: createdProductId,

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
                setSuccessMessage("Relación producto-proveedor creada correctamente.");
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible asociar el proveedor con el producto."
                    )
                );
            } finally {
                submittingRef.current = false;
                setIsSubmitting(false);
            }
        };

    const catalogsLoading =
        loadingProducts ||
        loadingSuppliers ||
        loadingUnits;

    const catalogsReady = productsLoaded && suppliersLoaded && unitsLoaded;
    const catalogsError = productsError || suppliersError || unitsError;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Productos por proveedor"
                description="Vincula tus productos con sus proveedores y define cómo se compran y reciben."
            />

            <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={toggleForm} disabled={isSubmitting} aria-expanded={showForm} aria-controls="new-product-supplier" className="inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none">
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    {showForm ? "Ocultar formulario" : "Nueva relación"}
                    <svg aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${showForm ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
            </div>

            {successMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">{successMessage}</div>}

            <div id="new-product-supplier" hidden={!showForm}>
                {showForm && (
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

                        {catalogsLoading ? <CatalogLoadingSkeleton label="Cargando productos, proveedores y unidades..." /> : catalogsError ? (
                            <div role="alert" className="mt-6 space-y-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                                <p>{catalogsError}</p>
                                <button type="button" onClick={() => void loadFormCatalogs()} className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 font-semibold text-sky-800 transition hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none">Reintentar</button>
                            </div>
                        ) : catalogsReady && (
                            <form
                                onSubmit={handleSubmit}
                                noValidate
                                className="mt-7"
                            >
                                <fieldset disabled={isSubmitting} className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    <div className="col-span-full flex items-center gap-3 border-b border-slate-100 pb-3">
                                        <span aria-hidden="true" className="text-xs font-semibold text-sky-700">01</span>
                                        <h3 className="text-sm font-semibold text-slate-800">Producto y proveedor</h3>
                                    </div>
                                    <div>
                                        <label htmlFor="relation-product" className="block text-sm font-medium text-slate-700">
                                            Producto
                                        </label>

                                        <select
                                            id="relation-product"
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
                                        <label htmlFor="relation-supplier" className="block text-sm font-medium text-slate-700">
                                            Proveedor
                                        </label>

                                        <select
                                            id="relation-supplier"
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
                                        <label htmlFor="relation-code" className="block text-sm font-medium text-slate-700">
                                            Código del proveedor
                                        </label>

                                        <input
                                            id="relation-code"
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
                                        <label htmlFor="relation-unit" className="block text-sm font-medium text-slate-700">
                                            Unidad de compra
                                        </label>

                                        <select
                                            id="relation-unit"
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
                                        <label htmlFor="relation-package-units" className="block text-sm font-medium text-slate-700">
                                            Unidades por paquete
                                        </label>

                                        <input
                                            id="relation-package-units"
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
                                        <label htmlFor="relation-barcode" className="block text-sm font-medium text-slate-700">
                                            Código de barras
                                        </label>

                                        <input
                                            id="relation-barcode"
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
                                </fieldset>
                            </form>
                        )}
                    </section>
                )}
            </div>

        </div>
    );
};
