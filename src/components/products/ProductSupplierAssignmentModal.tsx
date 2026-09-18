import { useRef, useState, type FormEvent } from "react";
import { productSuppliersService } from "../../api/services/ProductSuppliersService";
import type { useSupplierProducts } from "../../hooks/useSupplierProducts";
import type { PPEProduct, Supplier, UnitOfMeasure } from "../../types/types";
import { getApiErrorMessage } from "../../utils/utils";
import { CatalogFormModal } from "../catalogs/CatalogFormModal";

interface CommercialFields {
    supplierProductCode: string;
    purchaseUnitId: string;
    unitsPerPackage: string;
    packageBarcode: string;
    isPreferred: boolean;
}

interface Props {
    products: PPEProduct[];
    suppliers: Supplier[];
    units: UnitOfMeasure[];
    catalogsReady: boolean;
    catalogsLoading: boolean;
    catalogsError: string | null;
    loadCatalogs: () => Promise<unknown>;
    supplierId: number | null;
    onSelectSupplier: (id: number | null) => void;
    relations: ReturnType<typeof useSupplierProducts>;
    onClose: () => void;
}

const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100";

export const ProductSupplierAssignmentModal = ({
    products, suppliers, units, catalogsReady, catalogsLoading, catalogsError,
    loadCatalogs, supplierId, onSelectSupplier, relations, onClose,
}: Props) => {
    const [fields, setFields] = useState<Record<number, CommercialFields>>(() => Object.fromEntries(
        products.map((product) => [product.id, {
            supplierProductCode: "", purchaseUnitId: "", unitsPerPackage: "1",
            packageBarcode: "", isPreferred: false,
        }])
    ));
    const [errors, setErrors] = useState<Record<number, string>>({});
    const [completed, setCompleted] = useState(new Set<string>());
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const {
        supplierProducts, hasLoadedSupplierProducts, loadingSupplierProducts,
        supplierProductsError, refreshSupplierProducts, upsertRelation,
    } = relations;
    const ready = catalogsReady && !catalogsLoading && !catalogsError && supplierId !== null &&
        hasLoadedSupplierProducts && !loadingSupplierProducts && !supplierProductsError;
    const existing = new Map(supplierProducts.map((relation) => [relation.ppeProductId, relation]));
    const remaining = products.filter((product) => !existing.has(product.id) &&
        !completed.has(`${supplierId}:${product.id}`));

    const updateField = <K extends keyof CommercialFields>(id: number, key: K, value: CommercialFields[K]) => {
        setFields((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
        setErrors((current) => ({ ...current, [id]: "" }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (submittingRef.current || !ready || supplierId === null || remaining.length === 0) return;
        const validation: Record<number, string> = {};
        for (const product of remaining) {
            const values = fields[product.id];
            if (!units.some((unit) => unit.isActive && unit.id === Number(values.purchaseUnitId))) {
                validation[product.id] = "Selecciona una unidad de compra activa.";
            } else if (!Number.isInteger(Number(values.unitsPerPackage)) || Number(values.unitsPerPackage) <= 0) {
                validation[product.id] = "Las unidades por paquete deben ser un número entero mayor a cero.";
            }
        }
        setErrors(validation);
        if (Object.keys(validation).length) return;

        submittingRef.current = true;
        setSubmitting(true);
        try {
            // Individual endpoint: preserve each success and retry only missing relations.
            // Sequential writes also avoid an unbounded burst for large selections.
            for (const product of remaining) {
                const values = fields[product.id];
                try {
                    const relation = await productSuppliersService.create({
                        ppeProductId: product.id,
                        supplierId,
                        supplierProductCode: values.supplierProductCode.trim() || null,
                        purchaseUnitId: Number(values.purchaseUnitId),
                        unitsPerPackage: Number(values.unitsPerPackage),
                        packageBarcode: values.packageBarcode.trim() || null,
                        isPreferred: values.isPreferred,
                    });
                    upsertRelation(relation);
                    setCompleted((current) => new Set(current).add(`${supplierId}:${product.id}`));
                } catch (error) {
                    setErrors((current) => ({
                        ...current,
                        [product.id]: getApiErrorMessage(error, "No fue posible asignar este producto."),
                    }));
                }
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <CatalogFormModal
            id="supplier-assignment-modal"
            title="Asignar a proveedores"
            description="Selecciona un proveedor y configura la presentación de compra de cada producto. Las relaciones existentes se conservan."
            isSubmitting={submitting}
            onClose={() => { if (!submittingRef.current) onClose(); }}
        >
            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                {catalogsLoading && <p role="status" className="text-sm text-sky-800">Cargando proveedores y unidades...</p>}
                {catalogsError && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    {catalogsError}
                    <button type="button" disabled={catalogsLoading} onClick={() => void loadCatalogs()} className="ml-2 underline">Reintentar catálogos</button>
                </div>}
                <label className="block text-sm font-medium text-slate-700" htmlFor="assignment-supplier">Proveedor
                    <select id="assignment-supplier" className={inputClass} value={supplierId ?? ""}
                        disabled={submitting || !catalogsReady || catalogsLoading || !!catalogsError}
                        onChange={(event) => { setErrors({}); onSelectSupplier(event.target.value ? Number(event.target.value) : null); }}>
                        <option value="">Selecciona un proveedor...</option>
                        {suppliers.filter((supplier) => supplier.isActive).map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                    </select>
                </label>
                {catalogsReady && !suppliers.some((supplier) => supplier.isActive) && <p className="text-sm text-slate-600">No hay proveedores activos disponibles.</p>}
                {catalogsReady && units.length === 0 && <p className="text-sm text-slate-600">No hay unidades activas disponibles.</p>}
                {supplierId !== null && <div aria-busy={loadingSupplierProducts}>
                    {loadingSupplierProducts && <p role="status" className="text-sm text-sky-800">Consultando relaciones del proveedor...</p>}
                    {supplierProductsError && <p role="alert" className="text-sm text-amber-800">{supplierProductsError} Se conservan las relaciones consultadas.</p>}
                    <button type="button" disabled={submitting || loadingSupplierProducts} onClick={() => void refreshSupplierProducts(supplierId)} className="min-h-11 text-sm font-semibold text-sky-800 underline">
                        {supplierProductsError ? "Reintentar relaciones" : "Actualizar relaciones"}
                    </button>
                </div>}
                <p className="text-sm font-semibold text-slate-800">Productos seleccionados: {products.length}</p>
                {products.map((product) => {
                    const relation = existing.get(product.id);
                    const created = completed.has(`${supplierId}:${product.id}`);
                    const values = fields[product.id];
                    return <section key={product.id} className="min-w-0 rounded-xl border border-slate-200 p-4">
                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                        <p className="mt-1 break-all font-mono text-xs text-slate-500">{product.sku}</p>
                        {relation || created ? <p role="status" className="mt-3 text-sm text-sky-800">
                            {created ? "Asignado correctamente." : relation?.isActive ? "Ya está asignado a este proveedor." : "La relación existe y está inactiva. Reactívala desde Productos en Proveedores; no se creará otra relación."}
                        </p> : <fieldset disabled={submitting || !ready} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
                            <label className="text-sm text-slate-700" htmlFor={`purchase-unit-${product.id}`}>Unidad de compra
                                <select id={`purchase-unit-${product.id}`} className={inputClass} value={values.purchaseUnitId} onChange={(event) => updateField(product.id, "purchaseUnitId", event.target.value)}>
                                    <option value="">Selecciona...</option>
                                    {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ""}</option>)}
                                </select>
                            </label>
                            <label className="text-sm text-slate-700" htmlFor={`package-units-${product.id}`}>Unidades por paquete
                                <input id={`package-units-${product.id}`} className={inputClass} type="number" min="1" step="1" value={values.unitsPerPackage} onChange={(event) => updateField(product.id, "unitsPerPackage", event.target.value)} />
                            </label>
                            <label className="min-w-0 text-sm text-slate-700" htmlFor={`supplier-code-${product.id}`}>Código del proveedor
                                <input id={`supplier-code-${product.id}`} className={inputClass} value={values.supplierProductCode} onChange={(event) => updateField(product.id, "supplierProductCode", event.target.value)} />
                            </label>
                            <label className="min-w-0 text-sm text-slate-700" htmlFor={`package-barcode-${product.id}`}>Código de barras
                                <input id={`package-barcode-${product.id}`} className={inputClass} value={values.packageBarcode} onChange={(event) => updateField(product.id, "packageBarcode", event.target.value)} />
                            </label>
                            <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={values.isPreferred} onChange={(event) => updateField(product.id, "isPreferred", event.target.checked)} /> Proveedor preferido
                            </label>
                        </fieldset>}
                        {errors[product.id] && <p role="alert" className="mt-3 text-sm text-red-700">{errors[product.id]}</p>}
                    </section>;
                })}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                    <button type="button" disabled={submitting} onClick={() => { if (!submittingRef.current) onClose(); }} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">Cerrar</button>
                    <button type="submit" disabled={submitting || !ready || !remaining.length || !units.length} className="min-h-11 rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {submitting ? "Guardando..." : Object.values(errors).some(Boolean) ? "Reintentar pendientes" : "Asignar productos pendientes"}
                    </button>
                </div>
            </form>
        </CatalogFormModal>
    );
};
