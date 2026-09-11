import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    goodsReceiptsService,
} from "../api/services/GoodsReceiptsService";

import {
    usePurchaseOrders,
} from "../hooks/usePurchaseOrders";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import {
    getApiErrorMessage,
} from "../utils/utils";

import type {
    GoodsReceipt,
    PurchaseOrder,
} from "../types/types";

export const ReceivingPage = () => {
    const {
        purchaseOrders,
        loading: loadingOrders,
        error: ordersError,
        refresh: refreshOrders,
    } = usePurchaseOrders();

    const {
        warehouses,
        loading: loadingWarehouses,
    } = useWarehouses();

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        selectedOrder,
        setSelectedOrder,
    ] = useState<PurchaseOrder | null>(
        null
    );

    const [
        warehouseId,
        setWarehouseId,
    ] = useState("");

    const [
        notes,
        setNotes,
    ] = useState("");

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [
        receipt,
        setReceipt,
    ] = useState<GoodsReceipt | null>(
        null
    );

    const confirmedOrders =
        useMemo(() => {
            return purchaseOrders.filter(
                (order) =>
                    order.status === 2
            );
        }, [purchaseOrders]);


    const filteredOrders =
        useMemo(() => {
            const term =
                searchTerm
                    .trim()
                    .toLowerCase();

            if (!term) {
                return confirmedOrders;
            }

            return confirmedOrders.filter(
                (order) =>
                    order.folio
                        .toLowerCase()
                        .includes(term) ||
                    order.purchaseOrderNumber
                        .toLowerCase()
                        .includes(term) ||
                    order.supplierName
                        .toLowerCase()
                        .includes(term)
            );
        }, [
            confirmedOrders,
            searchTerm,
        ]);

    const handleSelectOrder = (
        order: PurchaseOrder
    ) => {
        setSelectedOrder(order);

        setReceipt(null);
        setFormError(null);
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);
            setReceipt(null);

            if (!selectedOrder) {
                setFormError(
                    "Selecciona una orden de compra."
                );

                return;
            }

            const parsedWarehouseId =
                Number(warehouseId);

            if (
                !Number.isInteger(
                    parsedWarehouseId
                ) ||
                parsedWarehouseId <= 0
            ) {
                setFormError(
                    "Selecciona un almacén."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                const result =
                    await goodsReceiptsService
                        .receive({
                            purchaseOrderFolio:
                                selectedOrder.folio,

                            warehouseId:
                                parsedWarehouseId,

                            notes:
                                notes.trim() ||
                                null,
                        });

                setReceipt(result);

                setSelectedOrder(null);
                setWarehouseId("");
                setNotes("");

                await refreshOrders();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible recibir la orden."
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
                    MESA · Almacén
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Recepción de mercancía
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Recibe órdenes de compra confirmadas
                    y registra automáticamente la entrada
                    al inventario.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">01</span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Órdenes pendientes de recepción
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Busca por folio, orden de compra
                            o proveedor.
                        </p>
                    </div>
                </div>

                <div className="relative mt-6">
                    <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
                    <input
                        aria-label="Buscar por folio, orden de compra o proveedor"
                        type="text"
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(
                                event.target.value
                            )
                        }
                        placeholder="Buscar orden..."
                        className="w-full rounded-xl border border-slate-300 bg-slate-50/70 py-3 pl-12 pr-4 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                    />
                </div>

                {loadingOrders && (
                    <div role="status" className="mt-5 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        Cargando órdenes...
                    </div>
                )}

                {!loadingOrders &&
                    ordersError && (
                        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {ordersError}
                        </div>
                    )}

                {!loadingOrders &&
                    !ordersError &&
                    filteredOrders.length === 0 && (
                        <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">No hay órdenes pendientes para esta consulta</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Aquí aparecerán las órdenes confirmadas que coincidan con tu búsqueda.</p>
                        </div>
                    )}

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    {filteredOrders.map(
                        (order) => (
                            <button
                                key={order.id}
                                type="button"
                                onClick={() =>
                                    handleSelectOrder(
                                        order
                                    )
                                }
                                className={`w-full min-w-0 rounded-2xl border p-5 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 motion-reduce:transition-none ${selectedOrder?.id ===
                                    order.id
                                    ? "border-sky-600 bg-sky-50 shadow-sm ring-1 ring-sky-600"
                                    : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50 hover:shadow-sm"
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 wrap-break-word">
                                        <p className="font-mono text-xs font-semibold text-sky-700">
                                            {order.folio}
                                        </p>

                                        <h3 className="mt-1 font-semibold text-slate-900">
                                            {
                                                order.purchaseOrderNumber
                                            }
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-600">
                                            {
                                                order.supplierName
                                            }
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                        Confirmada
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-sky-100 pt-4 text-xs font-medium tabular-nums text-slate-600">
                                    <span>
                                        {
                                            order.items.length
                                        }{" "}
                                        producto(s)
                                    </span>

                                    <span>
                                        Entrega:{" "}
                                        {new Date(
                                            order.confirmedDeliveryDate
                                        ).toLocaleDateString(
                                            "es-MX"
                                        )}
                                    </span>
                                </div>
                            </button>
                        )
                    )}
                </div>
            </section>

            {selectedOrder && (
                <section className="rounded-2xl border border-sky-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-semibold text-sky-700">02</span>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Detalle de recepción</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">Revisa los productos y selecciona el almacén de destino.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 wrap-break-word">
                            <p className="font-mono text-xs font-semibold text-slate-500">
                                {
                                    selectedOrder.folio
                                }
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-slate-900">
                                {
                                    selectedOrder.purchaseOrderNumber
                                }
                            </h2>

                            <p className="mt-1 text-sm text-slate-600">
                                {
                                    selectedOrder.supplierName
                                }
                            </p>
                        </div>

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                            Confirmada
                        </span>
                    </div>

                    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Productos a recibir">
                        <table className="w-full min-w-155 text-left text-sm">
                            <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                <tr>
                                    <th className="px-4 py-3">
                                        Producto
                                    </th>

                                    <th className="px-4 py-3">
                                        Unidad
                                    </th>

                                    <th className="px-4 py-3">
                                        Cantidad compra
                                    </th>

                                    <th className="px-4 py-3">
                                        Piezas a recibir
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {selectedOrder.items.map(
                                    (item) => (
                                        <tr key={item.id} className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none">
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {
                                                        item.productName
                                                    }
                                                </p>

                                                <p className="mt-1 font-mono text-xs text-slate-500">
                                                    {item.sku}
                                                </p>
                                            </td>

                                            <td className="px-4 py-4">
                                                {
                                                    item.purchaseUnit
                                                }
                                            </td>

                                            <td className="px-4 py-4">
                                                {
                                                    item.orderedPurchaseQuantity
                                                }
                                            </td>

                                            <td className="px-4 py-4 font-semibold text-slate-900">
                                                {
                                                    item.orderedStockQuantity
                                                }
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-7 border-t border-slate-100 pt-6"
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label htmlFor="receiving-warehouse" className="block text-sm font-medium text-slate-700">
                                    Almacén de destino
                                </label>

                                <select
                                    id="receiving-warehouse"
                                    value={warehouseId}
                                    onChange={(event) =>
                                        setWarehouseId(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loadingWarehouses ||
                                        isSubmitting
                                    }
                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        Selecciona almacén
                                    </option>

                                    {warehouses
                                        .filter(
                                            (warehouse) =>
                                                warehouse.isActive
                                        )
                                        .map(
                                            (warehouse) => (
                                                <option
                                                    key={
                                                        warehouse.id
                                                    }
                                                    value={
                                                        warehouse.id
                                                    }
                                                >
                                                    {
                                                        warehouse.code
                                                    }{" "}
                                                    -{" "}
                                                    {
                                                        warehouse.name
                                                    }
                                                </option>
                                            )
                                        )}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="receiving-notes" className="block text-sm font-medium text-slate-700">
                                    Notas de recepción
                                </label>

                                <textarea
                                    id="receiving-notes"
                                    value={notes}
                                    onChange={(event) =>
                                        setNotes(
                                            event.target.value
                                        )
                                    }
                                    rows={3}
                                    placeholder="Opcional"
                                    disabled={isSubmitting}
                                    className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>
                        </div>

                        {formError && (
                            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {isSubmitting
                                    ? "Registrando recepción..."
                                    : "Confirmar recepción"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {receipt && (
                <section role="status" className="rounded-2xl border border-emerald-200 bg-linear-to-br from-white to-emerald-50 p-6 shadow-sm sm:p-8">
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-emerald-100 p-2 text-emerald-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                    <p className="text-sm font-semibold text-emerald-800">
                        Recepción registrada correctamente
                    </p>

                    <h2 className="mt-2 wrap-break-word font-mono text-xl font-bold text-emerald-900">
                        {receipt.folio}
                    </h2>

                    <div className="mt-5 grid gap-4 border-t border-emerald-100 pt-5 text-sm leading-6 text-slate-700 md:grid-cols-3 [&>div]:min-w-0 [&>div]:wrap-break-word">
                        <div>
                            <span className="text-emerald-700">
                                Orden:
                            </span>{" "}
                            {receipt.purchaseOrderFolio}
                        </div>

                        <div>
                            <span className="text-emerald-700">
                                Almacén:
                            </span>{" "}
                            {receipt.warehouseName}
                        </div>

                        <div>
                            <span className="text-emerald-700">
                                Proveedor:
                            </span>{" "}
                            {receipt.supplierName}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
