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
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Almacén
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Recepción de mercancía
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Recibe órdenes de compra confirmadas
                    y registra automáticamente la entrada
                    al inventario.
                </p>
            </div>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="font-semibold text-slate-900">
                        Órdenes pendientes de recepción
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Busca por folio, orden de compra
                        o proveedor.
                    </p>
                </div>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) =>
                        setSearchTerm(
                            event.target.value
                        )
                    }
                    placeholder="Buscar orden..."
                    className="mt-5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                />

                {loadingOrders && (
                    <div className="mt-5 text-sm text-slate-500">
                        Cargando órdenes...
                    </div>
                )}

                {!loadingOrders &&
                    ordersError && (
                        <div className="mt-5 text-sm text-red-600">
                            {ordersError}
                        </div>
                    )}

                {!loadingOrders &&
                    !ordersError &&
                    filteredOrders.length === 0 && (
                        <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                            No hay órdenes confirmadas
                            pendientes de recepción.
                        </div>
                    )}

                <div className="mt-5 space-y-3">
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
                                className={`w-full rounded-xl border p-4 text-left transition ${selectedOrder?.id ===
                                    order.id
                                    ? "border-slate-900 bg-slate-50"
                                    : "border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="font-mono text-xs font-semibold text-slate-500">
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

                                <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500">
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
                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
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

                    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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

                            <tbody className="divide-y divide-slate-200">
                                {selectedOrder.items.map(
                                    (item) => (
                                        <tr key={item.id}>
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
                        className="mt-6"
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">
                                    Almacén de destino
                                </label>

                                <select
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
                                <label className="block text-sm font-medium text-slate-700">
                                    Notas de recepción
                                </label>

                                <textarea
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
                            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-sm font-medium text-emerald-700">
                        Recepción registrada correctamente
                    </p>

                    <h2 className="mt-2 font-mono text-lg font-bold text-emerald-900">
                        {receipt.folio}
                    </h2>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
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