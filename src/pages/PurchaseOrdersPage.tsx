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
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Compras
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Órdenes de compra
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Registra pedidos de EPP realizados
                    a proveedores.
                </p>
            </div>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    Nueva orden de compra
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6"
                >
                    <div className="grid gap-5 md:grid-cols-2">
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

                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-slate-900">
                                    Productos
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Agrega los EPP incluidos en la orden.
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
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm font-semibold text-slate-700">
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
                                                    className="text-sm font-medium text-red-600 hover:text-red-700"
                                                >
                                                    Quitar
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">
                                                    Producto EPP
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
                        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    )}

                    <div className="mt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Creando orden..."
                                : "Crear orden de compra"}
                        </button>
                    </div>

                </form>
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Órdenes registradas
                        </h2>

                        {!loading && !error && (
                            <p className="mt-1 text-xs text-slate-500">
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
                    <div className="p-6 text-sm text-slate-500">
                        Cargando órdenes...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    purchaseOrders.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No existen órdenes de compra.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    purchaseOrders.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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

                                <tbody className="divide-y divide-slate-200">
                                    {purchaseOrders.map(
                                        (order) => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-slate-50"
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
                                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
                                                            >
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