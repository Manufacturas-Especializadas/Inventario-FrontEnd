import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { usePPERequestFormOptions } from "../../hooks/usePPERequestFormOptions";
import { usePPERequests } from "../../hooks/usePPERequests";
import type { AuthUser, RequestablePPEProduct } from "../../types/types";
import { getRequestStatusConfig } from "../../utils/ppeRequestStatus";
import { getRequestReasonLabel } from "../../utils/requestReasonLabels";
import { PageHeader } from "../ui/PageHeader";

interface FormItem {
    key: string;
    ppeProductId: string;
    quantity: string;
}

const createEmptyItem = (): FormItem => ({ key: crypto.randomUUID(), ppeProductId: "", quantity: "1" });
const inputClassName = "mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60";
const buttonClassName = "min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50";

const productLabel = (product: RequestablePPEProduct) => [
    product.name,
    product.size?.trim() && `Talla: ${product.size.trim()}`,
    product.color?.trim() && `Color: ${product.color.trim()}`,
    product.model?.trim() && `Modelo: ${product.model.trim()}`,
].filter(Boolean).join(" · ");

export const ProductionPPERequestForm = ({ user }: { user: AuthUser }) => {
    const {
        options, loadingOptions, optionsError, loadOptions,
        warehouseId, products, loadingProducts, productsError, loadedWarehouseId,
        selectWarehouse, resetWarehouse,
    } = usePPERequestFormOptions();
    const { createRequest, createResult, loading, error, clearRequest } = usePPERequests({ autoLoadPending: false });
    const [showForm, setShowForm] = useState(false);
    const [requestReasonId, setRequestReasonId] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState<FormItem[]>([createEmptyItem()]);
    const [formError, setFormError] = useState<string | null>(null);
    const submitting = useRef(false);
    const formRef = useRef<HTMLFormElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const action = searchParams.get("action");
    const createActionHandled = useRef(false);

    const selectedReason = options?.requestReasons.find((reason) => reason.id === Number(requestReasonId));
    const notesRequired = Boolean(selectedReason && ["DAMAGE", "LOST", "OTHER"].includes(selectedReason.code));
    const productsReady = loadedWarehouseId !== null && loadedWarehouseId === Number(warehouseId) && !loadingProducts;
    const canSubmit = Boolean(options?.warehouses.length && selectedReason && productsReady && products.length && !loading);

    const openCreateForm = async () => {
        setShowForm(true);
        const data = await loadOptions();
        if (data?.warehouses.length === 1) {
            void selectWarehouse(String(data.warehouses[0].id));
        }
    };

    const handleNewRequestAction = useEffectEvent(() => {
        void openCreateForm();
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("action");
        setSearchParams(nextParams, { replace: true });
    });

    useEffect(() => {
        if (action !== "new") {
            createActionHandled.current = false;
            return;
        }
        if (createActionHandled.current) return;
        createActionHandled.current = true;
        handleNewRequestAction();
    }, [action]);

    useEffect(() => {
        if (showForm) formRef.current?.focus({ preventScroll: true });
    }, [showForm]);

    const updateItem = (key: string, field: "ppeProductId" | "quantity", value: string) => {
        setItems((current) => current.map((item) => item.key === key ? { ...item, [field]: value } : item));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting.current || !canSubmit) return;
        setFormError(null);
        clearRequest();

        if (notesRequired && !notes.trim()) {
            setFormError("Las notas son obligatorias para este motivo de solicitud.");
            return;
        }
        if (notes.length > 500) {
            setFormError("Las notas no pueden superar los 500 caracteres.");
            return;
        }

        const parsedItems = items.map((item) => ({ ppeProductId: Number(item.ppeProductId), quantity: Number(item.quantity) }));
        if (!parsedItems.length || new Set(parsedItems.map((item) => item.ppeProductId)).size !== parsedItems.length) {
            setFormError("Agrega al menos un producto y no repitas el mismo producto EPP.");
            return;
        }
        for (const item of parsedItems) {
            const product = products.find((entry) => entry.ppeProductId === item.ppeProductId);
            if (!product) {
                setFormError("Todos los renglones deben tener un producto disponible en el almacén seleccionado.");
                return;
            }
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
                setFormError("Las cantidades deben ser números enteros mayores a cero.");
                return;
            }
            if (item.quantity > product.availableQuantity) {
                setFormError(`No hay suficiente existencia de ${productLabel(product)} para la cantidad solicitada.`);
                return;
            }
        }

        submitting.current = true;
        try {
            const result = await createRequest({
                warehouseId: Number(warehouseId),
                requestReasonId: Number(requestReasonId),
                notes: notes.trim() || null,
                items: parsedItems,
            });
            if (!result) return;

            // The POST contains the result. Fetch fresh stock only when opening another request.
            setShowForm(false);
            setRequestReasonId("");
            setNotes("");
            setItems([createEmptyItem()]);
            resetWarehouse();
        } finally {
            submitting.current = false;
        }
    };

    const status = createResult ? getRequestStatusConfig(createResult.request.status) : null;

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader eyebrow="MESA · Solicitante EPP" title="Solicitar EPP" description="Solicita el equipo de protección personal para tu unidad organizacional." />
            <button type="button" aria-expanded={showForm} aria-controls="new-request-form" disabled={loading}
                onClick={() => { if (showForm) setShowForm(false); else void openCreateForm(); }}
                className="min-h-11 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:opacity-50">
                {showForm ? "Ocultar nueva solicitud" : "Nueva solicitud"}
            </button>

            {createResult && status && (
                <div role="status" className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p>Solicitud creada correctamente. Folio: {createResult.request.folio}</p>
                    <p><span className={`inline-block rounded-lg px-3 py-1 font-semibold ${status.className}`}>{status.label}</span></p>
                    {createResult.warnings.map((warning, index) => (
                        <p key={`${warning.code}-${warning.ppeProductId}-${index}`} className="text-amber-800">{warning.message}</p>
                    ))}
                </div>
            )}
            {(formError || error) && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{formError || error}</p>}

            {showForm && (
                <form id="new-request-form" ref={formRef} tabIndex={-1} onSubmit={(event) => void handleSubmit(event)} aria-busy={loadingOptions || loadingProducts || loading} className="space-y-6 rounded-2xl focus-visible:outline-sky-600">
                    <section className="rounded-2xl border border-sky-200 bg-white p-6 sm:p-8">
                        <h2 className="text-lg font-semibold text-slate-900">Solicitante</h2>
                        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                            <div><dt className="text-slate-500">Nombre</dt><dd className="mt-1 font-medium text-slate-900">{user.name}</dd></div>
                            <div><dt className="text-slate-500">Número de nómina</dt><dd className="mt-1 font-medium text-slate-900">{user.employeeNumber}</dd></div>
                            <div><dt className="text-slate-500">Unidad organizacional</dt><dd className="mt-1 font-medium text-slate-900">{user.organizationalUnitName ?? "Sin unidad asignada"}</dd></div>
                        </dl>
                    </section>

                    {loadingOptions && <p role="status" className="text-sm text-slate-600">Cargando opciones de solicitud...</p>}
                    {optionsError && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <p>{optionsError}</p>
                            <button type="button" disabled={loadingOptions} onClick={() => void openCreateForm()} className={`${buttonClassName} mt-3`}>Reintentar opciones</button>
                        </div>
                    )}
                    {options && (
                        <fieldset disabled={loading} className="min-w-0 space-y-6">
                            <legend className="sr-only">Datos de la solicitud</legend>
                            <section className="grid gap-5 rounded-2xl border border-sky-200 bg-white p-6 sm:grid-cols-2 sm:p-8">
                                <div className="min-w-0">
                                    {options.warehouses.length === 0 ? (
                                        <p role="status" className="text-sm text-amber-800">No hay almacenes disponibles para solicitar EPP. Contacta al administrador.</p>
                                    ) : options.warehouses.length === 1 ? (
                                        <div className="text-sm"><p className="font-medium text-slate-700">Almacén</p><p className="mt-2 text-slate-900">{options.warehouses[0].code} - {options.warehouses[0].name}</p></div>
                                    ) : (
                                        <>
                                            <label htmlFor="production-warehouse" className="text-sm font-medium text-slate-700">Almacén</label>
                                            <select id="production-warehouse" required value={warehouseId} onChange={(event) => {
                                                setItems([createEmptyItem()]);
                                                setFormError(null);
                                                void selectWarehouse(event.target.value);
                                            }} className={inputClassName}>
                                                <option value="">Selecciona un almacén</option>
                                                {options.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
                                            </select>
                                        </>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <label htmlFor="production-reason" className="text-sm font-medium text-slate-700">Motivo de solicitud</label>
                                    <select id="production-reason" required value={requestReasonId} onChange={(event) => setRequestReasonId(event.target.value)} className={inputClassName}>
                                        <option value="">Selecciona un motivo</option>
                                        {options.requestReasons.map((reason) => <option key={reason.id} value={reason.id}>{getRequestReasonLabel(reason.name, reason.code)}</option>)}
                                    </select>
                                    {selectedReason?.description && <p className="mt-2 text-sm text-slate-500">{selectedReason.description}</p>}
                                    {options.requestReasons.length === 0 && <p role="status" className="mt-2 text-sm text-amber-800">No hay motivos de solicitud disponibles.</p>}
                                </div>
                            </section>

                            {loadingProducts && <p role="status" className="text-sm text-slate-600">Cargando productos del almacén...</p>}
                            {productsError && (
                                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    <p>{productsError}</p>
                                    <button type="button" disabled={loadingProducts} onClick={() => void selectWarehouse(warehouseId)} className={`${buttonClassName} mt-3`}>Reintentar productos</button>
                                </div>
                            )}
                            {productsReady && products.length === 0 && <p role="status" className="text-sm text-amber-800">No hay productos disponibles para solicitar en este almacén.</p>}
                            {productsReady && products.length > 0 && (
                                <section className="space-y-4 rounded-2xl border border-sky-200 bg-white p-6 sm:p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h2 className="text-lg font-semibold text-slate-900">Artículos solicitados</h2>
                                        <button type="button" onClick={() => setItems((current) => [...current, createEmptyItem()])} className={buttonClassName}>Agregar producto</button>
                                    </div>
                                    {items.map((item, index) => {
                                        const product = products.find((entry) => entry.ppeProductId === Number(item.ppeProductId));
                                        return (
                                            <div key={item.key} className="grid gap-4 rounded-xl bg-sky-50/50 p-4 lg:grid-cols-[minmax(0,1fr)_150px_auto] lg:items-end">
                                                <div className="min-w-0">
                                                    <label htmlFor={`product-${item.key}`} className="text-sm font-medium text-slate-700">Producto {index + 1}</label>
                                                    <select id={`product-${item.key}`} required value={item.ppeProductId} onChange={(event) => updateItem(item.key, "ppeProductId", event.target.value)} className={inputClassName}>
                                                        <option value="">Selecciona un producto</option>
                                                        {products.map((entry) => <option key={entry.ppeProductId} value={entry.ppeProductId} disabled={entry.availableQuantity <= 0}>{productLabel(entry)}</option>)}
                                                    </select>
                                                    {product && <p className="mt-2 break-words text-sm text-slate-600">{productLabel(product)}</p>}
                                                </div>
                                                <div>
                                                    <label htmlFor={`quantity-${item.key}`} className="text-sm font-medium text-slate-700">Cantidad a solicitar</label>
                                                    <input id={`quantity-${item.key}`} type="number" required min="1" step="1" value={item.quantity} onChange={(event) => updateItem(item.key, "quantity", event.target.value)} className={inputClassName} />
                                                </div>
                                                <button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.key !== item.key))} className={buttonClassName}>Quitar</button>
                                            </div>
                                        );
                                    })}
                                </section>
                            )}

                            <section className="rounded-2xl border border-sky-200 bg-white p-6 sm:p-8">
                                <label htmlFor="production-notes" className="text-sm font-medium text-slate-700">Notas {notesRequired ? "(obligatorias)" : "(opcionales)"}</label>
                                <textarea id="production-notes" required={notesRequired} maxLength={500} rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} aria-describedby="production-notes-help" className={inputClassName} />
                                <p id="production-notes-help" className="mt-2 text-sm text-slate-500">{notesRequired ? "Explica el motivo de la solicitud. " : ""}{notes.length}/500 caracteres.</p>
                            </section>
                            <div className="flex justify-end">
                                <button type="submit" disabled={!canSubmit} className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                                    {loading ? "Creando solicitud..." : "Crear solicitud"}
                                </button>
                            </div>
                        </fieldset>
                    )}
                </form>
            )}
        </div>
    );
};
