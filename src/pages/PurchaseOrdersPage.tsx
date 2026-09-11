import {
    useState,
    type FormEvent,
} from "react";

import {
    purchaseOrdersService,
} from "../api/services/PurchaseOrdersService";

import {
    usePurchaseOrders,
} from "../hooks/usePurchaseOrders";

import {
    useSuppliers,
} from "../hooks/useSuppliers";

import {
    usePPEProducts,
} from "../hooks/usePPEProducts";

import {
    getApiErrorMessage,
} from "../utils/utils";
import type { PurchaseOrderStatus } from "../types/types";

interface PurchaseOrderFormItem {
    key: string;

    ppeProductId: string;

    orderedPurchaseQuantity: string;

    purchaseUnitCost: string;
}

const createEmptyItem =
    (): PurchaseOrderFormItem => ({
        key: crypto.randomUUID(),

        ppeProductId: "",

        orderedPurchaseQuantity: "1",

        purchaseUnitCost: "",
    });

const getTodayInputValue = () => {
    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


export const PurchaseOrdersPage = () => {
    const {
        purchaseOrders,
        loading,
        error,
        refresh,
    } = usePurchaseOrders();

    const {
        suppliers,
        loading: loadingSuppliers,
    } = useSuppliers();

    const {
        products,
        loading: loadingProducts,
    } = usePPEProducts();

    const [
        supplierId,
        setSupplierId,
    ] = useState("");

    const [
        purchaseOrderNumber,
        setPurchaseOrderNumber,
    ] = useState("");

    const [
        confirmedDeliveryDate,
        setConfirmedDeliveryDate,
    ] = useState("");

    const [
        currencyCode,
        setCurrencyCode,
    ] = useState("MXN");

    const [
        notes,
        setNotes,
    ] = useState("");

    const [
        items,
        setItems,
    ] = useState<PurchaseOrderFormItem[]>([
        createEmptyItem(),
    ]);

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(null);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const addItem = () => {
        setItems(
            (current) => [
                ...current,
                createEmptyItem(),
            ]
        );
    };

    const removeItem = (
        key: string
    ) => {
        setItems(
            (current) => {
                if (current.length === 1) {
                    return current;
                }

                return current.filter(
                    (item) =>
                        item.key !== key
                );
            }
        );
    };

    const getPurchaseOrderStatus = (
        status: PurchaseOrderStatus
    ) => {
        switch (status) {
            case 1:
                return {
                    label: "Borrador",
                    className:
                        "bg-slate-100 text-slate-700",
                };

            case 2:
                return {
                    label: "Confirmada",
                    className:
                        "bg-blue-50 text-blue-700",
                };

            case 3:
                return {
                    label: "Recibida",
                    className:
                        "bg-emerald-50 text-emerald-700",
                };

            case 4:
                return {
                    label: "Cancelada",
                    className:
                        "bg-red-50 text-red-700",
                };

            default:
                return {
                    label: "Desconocido",
                    className:
                        "bg-slate-100 text-slate-500",
                };
        }
    };

    const updateItem = (
        key: string,
        field:
            | "ppeProductId"
            | "orderedPurchaseQuantity"
            | "purchaseUnitCost",
        value: string
    ) => {
        setItems(
            (current) =>
                current.map(
                    (item) =>
                        item.key === key
                            ? {
                                ...item,
                                [field]: value,
                            }
                            : item
                )
        );
    };

    const resetForm = () => {
        setSupplierId("");
        setPurchaseOrderNumber("");
        setConfirmedDeliveryDate("");
        setCurrencyCode("MXN");
        setNotes("");

        setItems([
            createEmptyItem(),
        ]);
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);
            setSuccessMessage(null);

            const parsedSupplierId =
                Number(supplierId);

            if (
                !Number.isInteger(
                    parsedSupplierId
                ) ||
                parsedSupplierId <= 0
            ) {
                setFormError(
                    "Selecciona un proveedor."
                );

                return;
            }

            if (
                !purchaseOrderNumber.trim()
            ) {
                setFormError(
                    "El número de orden de compra es obligatorio."
                );

                return;
            }

            if (!confirmedDeliveryDate) {
                setFormError(
                    "La fecha de entrega confirmada es obligatoria."
                );

                return;
            }

            if (!currencyCode.trim()) {
                setFormError(
                    "La moneda es obligatoria."
                );

                return;
            }

            const selectedProductIds =
                items.map(
                    (item) =>
                        Number(
                            item.ppeProductId
                        )
                );

            if (
                selectedProductIds.some(
                    (id) =>
                        !Number.isInteger(id) ||
                        id <= 0
                )
            ) {
                setFormError(
                    "Todos los renglones deben tener un producto."
                );

                return;
            }

            const uniqueProductIds =
                new Set(
                    selectedProductIds
                );

            if (
                uniqueProductIds.size !==
                selectedProductIds.length
            ) {
                setFormError(
                    "No puedes agregar el mismo producto más de una vez."
                );

                return;
            }

            const parsedItems =
                items.map((item) => {
                    const quantity =
                        Number(
                            item.orderedPurchaseQuantity
                        );

                    const costText =
                        item.purchaseUnitCost
                            .trim()
                            .replace(",", ".");

                    const cost =
                        costText
                            ? Number(costText)
                            : null;

                    return {
                        ppeProductId:
                            Number(
                                item.ppeProductId
                            ),

                        orderedPurchaseQuantity:
                            quantity,

                        purchaseUnitCost:
                            cost,
                    };
                });

            if (
                parsedItems.some(
                    (item) =>
                        !Number.isInteger(
                            item.orderedPurchaseQuantity
                        ) ||
                        item.orderedPurchaseQuantity <= 0
                )
            ) {
                setFormError(
                    "Las cantidades deben ser números enteros mayores a cero."
                );

                return;
            }

            if (
                parsedItems.some(
                    (item) =>
                        item.purchaseUnitCost !== null &&
                        (
                            !Number.isFinite(
                                item.purchaseUnitCost
                            ) ||
                            item.purchaseUnitCost < 0
                        )
                )
            ) {
                setFormError(
                    "Los costos unitarios no son válidos."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                const created =
                    await purchaseOrdersService
                        .create({
                            supplierId:
                                parsedSupplierId,

                            purchaseOrderNumber:
                                purchaseOrderNumber
                                    .trim(),

                            confirmedDeliveryDate:
                                `${confirmedDeliveryDate}T00:00:00`,

                            currencyCode:
                                currencyCode.trim(),

                            notes:
                                notes.trim() ||
                                null,

                            items:
                                parsedItems,
                        });

                setSuccessMessage(
                    `Orden creada correctamente. Folio: ${created.folio}`
                );

                resetForm();

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible crear la orden de compra."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }

        }

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Compras
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Órdenes de compra
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Organiza los pedidos de artículos y materiales para la operación de MESA.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5" /></svg>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Nueva orden de compra
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Define el proveedor, la entrega y los productos de tu pedido.</p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7"
                >
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-3">
                        <span aria-hidden="true" className="text-xs font-semibold text-sky-700">01</span>
                        <h3 className="text-sm font-semibold text-slate-800">Datos de la orden</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
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
                                    loadingSuppliers ||
                                    isSubmitting
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="">
                                    Selecciona un proveedor
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
                                Número de orden de compra
                            </label>

                            <input
                                type="text"
                                value={
                                    purchaseOrderNumber
                                }
                                onChange={(event) =>
                                    setPurchaseOrderNumber(
                                        event.target.value
                                    )
                                }
                                placeholder="Ej. OC-2026-00125"
                                disabled={isSubmitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Fecha de entrega confirmada
                            </label>

                            <input
                                type="date"
                                value={
                                    confirmedDeliveryDate
                                }
                                min={
                                    getTodayInputValue()
                                }
                                onChange={(event) =>
                                    setConfirmedDeliveryDate(
                                        event.target.value
                                    )
                                }
                                disabled={isSubmitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Moneda
                            </label>

                            <select
                                value={currencyCode}
                                onChange={(event) =>
                                    setCurrencyCode(
                                        event.target.value
                                    )
                                }
                                disabled={isSubmitting}
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            >
                                <option value="MXN">
                                    MXN
                                </option>

                                <option value="USD">
                                    USD
                                </option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Notas
                            </label>

                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(
                                        event.target.value
                                    )
                                }
                                rows={3}
                                disabled={isSubmitting}
                                className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                            />
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    <span aria-hidden="true" className="mr-3 text-xs font-semibold text-sky-700">02</span>
                                    Productos
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Agrega los artículos incluidos en la orden.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                disabled={isSubmitting}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                + Agregar producto
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {items.map(
                                (item, index) => (
                                    <div
                                        key={item.key}
                                        className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 sm:p-6"
                                    >
                                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
                                            <span className="rounded-lg border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800">
                                                Producto {index + 1}
                                            </span>

                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(
                                                            item.key
                                                        )
                                                    }
                                                    className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none"
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Producto
                                                </label>

                                                <select
                                                    value={
                                                        item.ppeProductId
                                                    }
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "ppeProductId",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        loadingProducts ||
                                                        isSubmitting
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                                >
                                                    <option value="">
                                                        Selecciona producto
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
                                                                    {
                                                                        product.sku
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        product.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Cantidad de compra
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={
                                                        item.orderedPurchaseQuantity
                                                    }
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "orderedPurchaseQuantity",
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Costo por unidad de compra
                                                </label>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.purchaseUnitCost
                                                    }
                                                    onChange={(event) =>
                                                        updateItem(
                                                            item.key,
                                                            "purchaseUnitCost",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Opcional"
                                                    disabled={
                                                        isSubmitting
                                                    }
                                                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>

                    {formError && (
                        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    {successMessage && (
                        <div role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            {successMessage}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                        >
                            {isSubmitting
                                ? "Creando orden..."
                                : "Crear orden de compra"}
                        </button>
                    </div>

                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Órdenes registradas
                        </h2>

                        {!loading && !error && (
                            <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
                                {purchaseOrders.length} órdenes
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
                    <div role="status" className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        Cargando órdenes...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    purchaseOrders.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5" /></svg>
                            <p className="text-sm font-semibold text-slate-900">Aún no hay órdenes de compra</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Registra tu primer pedido utilizando el formulario superior.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    purchaseOrders.length > 0 && (
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Órdenes de compra registradas">
                            <table className="w-full min-w-225 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th className="px-5 py-3">
                                            Folio
                                        </th>

                                        <th className="px-5 py-3">
                                            OC
                                        </th>

                                        <th className="px-5 py-3">
                                            Proveedor
                                        </th>

                                        <th className="px-5 py-3">
                                            Entrega
                                        </th>

                                        <th className="px-5 py-3">
                                            Productos
                                        </th>

                                        <th className="px-5 py-3">
                                            Moneda
                                        </th>

                                        <th className="px-5 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {purchaseOrders.map(
                                        (order) => (
                                            <tr
                                                key={order.id}
                                                className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-900">
                                                    {
                                                        order.folio
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        order.purchaseOrderNumber
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        order.supplierName
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {new Date(
                                                        order.confirmedDeliveryDate
                                                    ).toLocaleDateString(
                                                        "es-MX"
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        order.items.length
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {
                                                        order.currencyCode
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {(() => {
                                                        const status =
                                                            getPurchaseOrderStatus(
                                                                order.status
                                                            );

                                                        return (
                                                            <span
                                                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-current/15 ${status.className}`}
                                                            >
                                                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                                                {status.label}
                                                            </span>
                                                        );
                                                    })()}
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
