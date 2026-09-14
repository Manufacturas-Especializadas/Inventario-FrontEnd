import {
    useEffect,
    useState,
    useMemo,
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

import type {
    ProductSupplier,
    PurchaseOrder,
    PurchaseOrderStatus,
} from "../types/types";

import {
    productSuppliersService,
} from "../api/services/ProductSuppliersService";
import { getApiErrorMessage } from "../utils/utils";

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

const formatDate = (value: string) => {
    return new Intl.DateTimeFormat(
        "es-MX"
    ).format(
        new Date(value)
    );
};

const formatMoney = (
    value: number,
    currencyCode: string
) => {
    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: currencyCode,
        }
    ).format(value);
};


export const PurchaseOrdersPage = () => {
    const {
        purchaseOrders,
        loading,
        error,
        refresh,
    } = usePurchaseOrders();

    const clearOrderFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setDateFrom("");
        setDateTo("");
    };

    const {
        suppliers,
        loading: loadingSuppliers,
    } = useSuppliers();

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

    const [
        supplierProducts,
        setSupplierProducts,
    ] = useState<ProductSupplier[]>([]);

    const [
        loadingSupplierProducts,
        setLoadingSupplierProducts,
    ] = useState(false);

    const [
        supplierProductsError,
        setSupplierProductsError,
    ] = useState<string | null>(null);

    const [
        editingOrder,
        setEditingOrder,
    ] = useState<PurchaseOrder | null>(
        null
    );

    const [
        detailOrder,
        setDetailOrder,
    ] = useState<PurchaseOrder | null>(
        null
    );

    const [
        loadingDetail,
        setLoadingDetail,
    ] = useState(false);

    const [
        detailError,
        setDetailError,
    ] = useState<string | null>(
        null
    );

    const [
        cancellingOrder,
        setCancellingOrder,
    ] = useState<PurchaseOrder | null>(
        null
    );

    const [
        cancellationReason,
        setCancellationReason,
    ] = useState("");

    const [
        cancelling,
        setCancelling,
    ] = useState(false);
    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<
        "all" | "confirmed" | "received" | "cancelled"
    >("all");

    const [
        dateFrom,
        setDateFrom,
    ] = useState("");

    const [
        dateTo,
        setDateTo,
    ] = useState("");

    const filteredPurchaseOrders =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLocaleLowerCase(
                        "es"
                    );

            return purchaseOrders.filter(
                (order) => {
                    const matchesSearch =
                        !normalizedSearch ||
                        [
                            order.folio,
                            order.purchaseOrderNumber,
                            order.supplierName,
                        ].some((value) =>
                            value
                                .toLocaleLowerCase(
                                    "es"
                                )
                                .includes(
                                    normalizedSearch
                                )
                        );

                    const matchesStatus =
                        statusFilter ===
                        "all" ||
                        (
                            statusFilter ===
                            "confirmed" &&
                            order.status === 2
                        ) ||
                        (
                            statusFilter ===
                            "received" &&
                            order.status === 3
                        ) ||
                        (
                            statusFilter ===
                            "cancelled" &&
                            order.status === 4
                        );

                    const orderDate =
                        order.orderDate
                            .slice(0, 10);

                    const matchesFrom =
                        !dateFrom ||
                        orderDate >=
                        dateFrom;

                    const matchesTo =
                        !dateTo ||
                        orderDate <=
                        dateTo;

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesFrom &&
                        matchesTo
                    );
                }
            );
        }, [
            purchaseOrders,
            search,
            statusFilter,
            dateFrom,
            dateTo,
        ]);

    const openDetails =
        async (
            order: PurchaseOrder
        ) => {
            setDetailOrder(null);
            setDetailError(null);
            setLoadingDetail(true);

            try {
                const detail =
                    await purchaseOrdersService
                        .getByFolio(
                            order.folio
                        );

                setDetailOrder(
                    detail
                );
            } catch (error) {
                setDetailError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los detalles de la orden."
                    )
                );
            } finally {
                setLoadingDetail(false);
            }
        };

    const startEditing =
        async (
            order: PurchaseOrder
        ) => {
            setFormError(null);
            setSuccessMessage(null);

            try {
                const detail =
                    await purchaseOrdersService
                        .getByFolio(
                            order.folio
                        );

                setEditingOrder(
                    detail
                );

                setSupplierId(
                    String(
                        detail.supplierId
                    )
                );

                setPurchaseOrderNumber(
                    detail.purchaseOrderNumber
                );

                setConfirmedDeliveryDate(
                    detail.confirmedDeliveryDate
                        .slice(0, 10)
                );

                setCurrencyCode(
                    detail.currencyCode
                );

                setNotes(
                    detail.notes ?? ""
                );

                setItems(
                    detail.items.map(
                        (item) => ({
                            key:
                                crypto.randomUUID(),

                            ppeProductId:
                                String(
                                    item.ppeProductId
                                ),

                            orderedPurchaseQuantity:
                                String(
                                    item.orderedPurchaseQuantity
                                ),

                            purchaseUnitCost:
                                item.purchaseUnitCost !==
                                    null
                                    ? String(
                                        item.purchaseUnitCost
                                    )
                                    : "",
                        })
                    )
                );

                window.scrollTo({
                    top: 0,
                    behavior:
                        "smooth",
                });
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar la orden para editarla."
                    )
                );
            }
        };

    useEffect(() => {
        const parsedSupplierId =
            Number(supplierId);

        if (
            !supplierId ||
            !Number.isInteger(
                parsedSupplierId
            ) ||
            parsedSupplierId <= 0
        ) {
            setSupplierProducts([]);
            setSupplierProductsError(null);
            setLoadingSupplierProducts(false);

            return;
        }

        let cancelled = false;

        const loadSupplierProducts =
            async () => {
                setLoadingSupplierProducts(
                    true
                );

                setSupplierProductsError(
                    null
                );

                setSupplierProducts([]);

                try {
                    const data =
                        await productSuppliersService
                            .getBySupplier(
                                parsedSupplierId
                            );

                    if (!cancelled) {
                        setSupplierProducts(
                            data
                        );
                    }
                } catch (error) {
                    if (!cancelled) {
                        setSupplierProductsError(
                            getApiErrorMessage(
                                error,
                                "No fue posible cargar los productos del proveedor."
                            )
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setLoadingSupplierProducts(
                            false
                        );
                    }
                }
            };

        void loadSupplierProducts();

        return () => {
            cancelled = true;
        };
    }, [supplierId]);

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
                const request = {
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
                };

                if (editingOrder) {
                    const updated =
                        await purchaseOrdersService
                            .update(
                                editingOrder.folio,
                                request
                            );

                    setSuccessMessage(
                        `Orden ${updated.folio} actualizada correctamente.`
                    );
                } else {
                    const created =
                        await purchaseOrdersService
                            .create(
                                request
                            );

                    setSuccessMessage(
                        `Orden creada correctamente. Folio: ${created.folio}`
                    );
                }

                resetForm();

                await refresh();

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

    const confirmCancellation =
        async () => {
            if (
                !cancellingOrder ||
                !cancellationReason.trim()
            ) {
                return;
            }

            setCancelling(true);

            try {
                const cancelled =
                    await purchaseOrdersService
                        .cancel(
                            cancellingOrder.folio,
                            {
                                reason:
                                    cancellationReason.trim(),
                            }
                        );

                setSuccessMessage(
                    `Orden ${cancelled.folio} cancelada correctamente.`
                );

                setCancellingOrder(
                    null
                );

                setCancellationReason(
                    ""
                );

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cancelar la orden."
                    )
                );
            } finally {
                setCancelling(false);
            }
        };

    return (
        <div className="mx-auto min-w-0 max-w-7xl space-y-6">
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
                            {editingOrder
                                ? `Editar orden ${editingOrder.folio}`
                                : "Nueva orden de compra"}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            {editingOrder
                                ? "Modifica los datos, productos y cantidades de la orden."
                                : "Define el proveedor, la entrega y los productos de tu pedido."}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7"
                >
                    <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-semibold text-sky-800">01</span>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">Datos de la orden</h3>
                            <p className="mt-1 text-sm text-slate-500">Identifica el pedido y confirma las condiciones de entrega.</p>
                        </div>
                    </div>
                    <div className="grid min-w-0 gap-5 sm:grid-cols-2 2xl:grid-cols-4 [&>div]:min-w-0">
                        <div>
                            <label htmlFor="purchase-order-supplier" className="block text-sm font-medium text-slate-700">
                                Proveedor
                            </label>

                            <select
                                id="purchase-order-supplier"
                                aria-busy={loadingSuppliers}
                                onChange={(event) => {
                                    setSupplierId(
                                        event.target.value
                                    );

                                    setItems([
                                        createEmptyItem(),
                                    ]);

                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
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
                            {loadingSuppliers && (
                                <p role="status" className="mt-2 text-sm text-sky-700">
                                    Cargando proveedores...
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="purchase-order-number" className="block text-sm font-medium text-slate-700">
                                Número de orden de compra
                            </label>

                            <input
                                id="purchase-order-number"
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
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="purchase-order-delivery" className="block text-sm font-medium text-slate-700">
                                Fecha de entrega confirmada
                            </label>

                            <input
                                id="purchase-order-delivery"
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
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="purchase-order-currency" className="block text-sm font-medium text-slate-700">
                                Moneda
                            </label>

                            <select
                                id="purchase-order-currency"
                                value={currencyCode}
                                onChange={(event) =>
                                    setCurrencyCode(
                                        event.target.value
                                    )
                                }
                                disabled={isSubmitting}
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            >
                                <option value="MXN">
                                    MXN
                                </option>

                                <option value="USD">
                                    USD
                                </option>
                            </select>
                        </div>

                        <div className="sm:col-span-2 2xl:col-span-4">
                            <label htmlFor="purchase-order-notes" className="block text-sm font-medium text-slate-700">
                                Notas
                            </label>

                            <textarea
                                id="purchase-order-notes"
                                value={notes}
                                onChange={(event) =>
                                    setNotes(
                                        event.target.value
                                    )
                                }
                                rows={3}
                                disabled={isSubmitting}
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none resize-y"
                            />
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="flex items-center gap-3 font-semibold text-slate-900">
                                    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-xs font-semibold text-sky-800">02</span>
                                    Productos
                                </h3>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Selecciona cada artículo, indica la cantidad y revisa su equivalencia a inventario.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={addItem}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 min-h-11"
                                disabled={
                                    isSubmitting ||
                                    !supplierId ||
                                    loadingSupplierProducts ||
                                    Boolean(
                                        supplierProductsError
                                    ) ||
                                    supplierProducts.length === 0
                                }
                            >
                                + Agregar producto
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {items.map(
                                (item, index) => (
                                    <div
                                        key={item.key}
                                        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
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

                                        <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] [&>div]:min-w-0">
                                            <div className="sm:col-span-2 xl:col-span-1">
                                                <label htmlFor={`purchase-order-product-${item.key}`} className="block text-sm font-medium text-slate-700">
                                                    Producto
                                                </label>

                                                <select
                                                    id={`purchase-order-product-${item.key}`}
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
                                                        !supplierId ||
                                                        loadingSupplierProducts ||
                                                        Boolean(
                                                            supplierProductsError
                                                        ) ||
                                                        isSubmitting
                                                    }
                                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                                >


                                                    <option value="">
                                                        {!supplierId
                                                            ? "Selecciona primero un proveedor"
                                                            : loadingSupplierProducts
                                                                ? "Cargando productos..."
                                                                : "Selecciona producto"}
                                                    </option>

                                                    {supplierProducts.map(
                                                        (relation) => (
                                                            <option
                                                                key={
                                                                    relation.ppeProductId
                                                                }
                                                                value={
                                                                    relation.ppeProductId
                                                                }
                                                            >
                                                                {relation.sku}
                                                                {" - "}
                                                                {relation.productName}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {supplierId &&
                                                    !loadingSupplierProducts &&
                                                    !supplierProductsError &&
                                                    supplierProducts.length === 0 && (
                                                        <p className="mt-2 text-sm text-amber-700">
                                                            Este proveedor no tiene productos activos configurados.
                                                        </p>
                                                    )}

                                                {supplierProductsError && (
                                                    <p className="mt-2 text-sm text-red-700">
                                                        {supplierProductsError}
                                                    </p>
                                                )}

                                            </div>

                                            <div>
                                                <label htmlFor={`purchase-order-quantity-${item.key}`} className="block text-sm font-medium text-slate-700">
                                                    Cantidad de compra
                                                </label>

                                                <input
                                                    id={`purchase-order-quantity-${item.key}`}
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
                                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor={`purchase-order-cost-${item.key}`} className="block text-sm font-medium text-slate-700">
                                                    Costo por unidad de compra
                                                </label>

                                                <input
                                                    id={`purchase-order-cost-${item.key}`}
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
                                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                                />
                                            </div>

                                            {item.ppeProductId &&
                                                (() => {
                                                    const relation =
                                                        supplierProducts.find(
                                                            (product) =>
                                                                product.ppeProductId ===
                                                                Number(
                                                                    item.ppeProductId
                                                                )
                                                        );

                                                    if (!relation) {
                                                        return null;
                                                    }

                                                    const purchaseQuantity =
                                                        Number(
                                                            item.orderedPurchaseQuantity
                                                        );

                                                    const stockQuantity =
                                                        Number.isFinite(
                                                            purchaseQuantity
                                                        ) &&
                                                            purchaseQuantity > 0
                                                            ? purchaseQuantity *
                                                            relation.unitsPerPackage
                                                            : 0;

                                                    return (
                                                        <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-4 sm:col-span-2 xl:col-span-3">
                                                            <div className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                                                                <div>
                                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                                        Unidad de inventario
                                                                    </p>

                                                                    <p className="mt-1 font-semibold text-slate-900">
                                                                        {
                                                                            relation.stockUnit
                                                                        }

                                                                        {relation.stockUnitSymbol &&
                                                                            ` (${relation.stockUnitSymbol})`}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                                        Unidad de compra
                                                                    </p>

                                                                    <p className="mt-1 font-semibold text-slate-900">
                                                                        {
                                                                            relation.purchaseUnit
                                                                        }

                                                                        {relation.purchaseUnitSymbol &&
                                                                            ` (${relation.purchaseUnitSymbol})`}
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                                        Contenido
                                                                    </p>

                                                                    <p className="mt-1 font-semibold text-slate-900">
                                                                        1{" "}
                                                                        {
                                                                            relation.purchaseUnit
                                                                        }{" "}
                                                                        ={" "}
                                                                        {
                                                                            relation.unitsPerPackage
                                                                        }{" "}
                                                                        {
                                                                            relation.stockUnit
                                                                        }
                                                                    </p>
                                                                </div>

                                                                <div>
                                                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                                        Código del proveedor
                                                                    </p>

                                                                    <p className="mt-1 font-semibold text-slate-900">
                                                                        {relation.supplierProductCode ??
                                                                            "No registrado"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {stockQuantity > 0 && (
                                                                <div className="mt-4 border-t border-sky-200 pt-3">
                                                                    <p className="text-sm text-sky-900">
                                                                        <span className="font-semibold">
                                                                            Equivalencia:
                                                                        </span>{" "}
                                                                        {purchaseQuantity}{" "}
                                                                        {
                                                                            relation.purchaseUnit
                                                                        }{" "}
                                                                        ={" "}
                                                                        <span className="font-semibold">
                                                                            {
                                                                                stockQuantity
                                                                            }{" "}
                                                                            {
                                                                                relation.stockUnit
                                                                            }
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
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

                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                        {editingOrder && (
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={isSubmitting}
                                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 min-h-11"
                            >
                                Cancelar edición
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto min-h-11"
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : editingOrder
                                    ? "Guardar cambios"
                                    : "Crear orden de compra"}
                        </button>
                    </div>

                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Órdenes registradas
                            </h2>

                            {!loading && !error && (
                                <p className="mt-2 text-sm text-slate-500">
                                    Mostrando{" "}
                                    <span className="font-semibold text-slate-800">
                                        {filteredPurchaseOrders.length}
                                    </span>{" "}
                                    de{" "}
                                    <span className="font-semibold text-slate-800">
                                        {purchaseOrders.length}
                                    </span>{" "}
                                    órdenes
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void refresh()
                            }
                            disabled={loading}
                            className="rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors hover:bg-sky-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 min-h-11"
                        >
                            Actualizar
                        </button>
                    </div>

                    <div className="mt-6 grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0">
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="purchase-order-search"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Buscar
                            </label>

                            <input
                                id="purchase-order-search"
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Folio, número de OC o proveedor..."
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="purchase-order-status"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Estado
                            </label>

                            <select
                                id="purchase-order-status"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target
                                            .value as
                                        | "all"
                                        | "confirmed"
                                        | "received"
                                        | "cancelled"
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            >
                                <option value="all">
                                    Todos
                                </option>

                                <option value="confirmed">
                                    Confirmadas
                                </option>

                                <option value="received">
                                    Recibidas
                                </option>

                                <option value="cancelled">
                                    Canceladas
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="purchase-order-date-from"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Fecha de orden · Desde
                            </label>

                            <input
                                id="purchase-order-date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(event) =>
                                    setDateFrom(
                                        event.target.value
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="purchase-order-date-to"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Fecha de orden · Hasta
                            </label>

                            <input
                                id="purchase-order-date-to"
                                type="date"
                                value={dateTo}
                                min={dateFrom || undefined}
                                onChange={(event) =>
                                    setDateTo(
                                        event.target.value
                                    )
                                }
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        <div className="flex items-end sm:col-span-2 xl:justify-end">
                            <button
                                type="button"
                                onClick={
                                    clearOrderFilters
                                }
                                disabled={
                                    !search &&
                                    statusFilter ===
                                    "all" &&
                                    !dateFrom &&
                                    !dateTo
                                }
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 min-h-11"
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div
                        role="status"
                        className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800"
                    >
                        Cargando órdenes...
                    </div>
                )}

                {!loading && error && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    purchaseOrders.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">
                                Aún no hay órdenes de compra
                            </p>

                            <p className="mt-2 text-sm text-slate-600">
                                Registra tu primer pedido utilizando el formulario superior.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    purchaseOrders.length > 0 &&
                    filteredPurchaseOrders.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                            <p className="font-semibold text-slate-900">
                                No encontramos órdenes
                            </p>

                            <p className="mt-2 text-sm text-slate-600">
                                Modifica la búsqueda o los filtros para mostrar otros resultados.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredPurchaseOrders.length >
                    0 && (
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200" tabIndex={0} role="region" aria-label="Listado de órdenes de compra">
                            <table className="w-full min-w-280 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">
                                            Folio
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            OC
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Proveedor
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Fecha
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Entrega
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Productos
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Estado
                                        </th>

                                        <th scope="col" className="px-5 py-3 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredPurchaseOrders.map(
                                        (order) => {
                                            const status =
                                                getPurchaseOrderStatus(
                                                    order.status
                                                );

                                            const canModify =
                                                order.status ===
                                                1 ||
                                                order.status ===
                                                2;

                                            return (
                                                <tr
                                                    key={
                                                        order.id
                                                    }
                                                    className="transition-colors hover:bg-sky-50/40"
                                                >
                                                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-900">
                                                        {
                                                            order.folio
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 font-medium text-slate-800">
                                                        {
                                                            order.purchaseOrderNumber
                                                        }
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-700">
                                                        {
                                                            order.supplierName
                                                        }
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                        {formatDate(
                                                            order.orderDate
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                        {formatDate(
                                                            order.confirmedDeliveryDate
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            {
                                                                order
                                                                    .items
                                                                    .length
                                                            }{" "}
                                                            {order
                                                                .items
                                                                .length ===
                                                                1
                                                                ? "producto"
                                                                : "productos"}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-current/15 ${status.className}`}
                                                        >
                                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                                            {
                                                                status.label
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="ml-auto grid w-40 grid-cols-1 gap-2 sm:w-[25rem] sm:grid-cols-3">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void openDetails(
                                                                        order
                                                                    )
                                                                }
                                                                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                                                            >
                                                                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                                Ver detalles
                                                            </button>

                                                            {canModify && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            void startEditing(
                                                                                order
                                                                            )
                                                                        }
                                                                        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                                                                    >
                                                                        <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z" /></svg>
                                                                        Editar
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setCancellingOrder(
                                                                                order
                                                                            );

                                                                            setCancellationReason(
                                                                                ""
                                                                            );
                                                                        }}
                                                                        className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none"
                                                                    >
                                                                        <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></svg>
                                                                        Cancelar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
            </section>
            {(
                loadingDetail ||
                detailError ||
                detailOrder
            ) && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle de orden de compra"
                    >
                        <div className="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-sky-100 bg-slate-50 shadow-2xl">
                            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-sky-200 bg-linear-to-br from-white to-sky-100 px-5 py-5 sm:px-8 sm:py-6">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                                        Orden de compra
                                    </p>

                                    <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">
                                        {detailOrder
                                            ? detailOrder.folio
                                            : "Detalle"}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">Consulta la entrega, los productos y los costos de esta orden.</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setDetailOrder(
                                            null
                                        );

                                        setDetailError(
                                            null
                                        );
                                    }}
                                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                                    aria-label="Cerrar"
                                >
                                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg>
                                </button>
                            </div>

                            {loadingDetail && (
                                <div role="status" className="flex flex-col items-center gap-4 px-6 py-16 text-center text-sm text-sky-800">
                                    <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700 motion-reduce:animate-none" />
                                    Cargando detalle...
                                </div>
                            )}

                            {!loadingDetail &&
                                detailError && (
                                    <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {
                                            detailError
                                        }
                                    </div>
                                )}

                            {!loadingDetail &&
                                detailOrder &&
                                (() => {
                                    const status =
                                        getPurchaseOrderStatus(
                                            detailOrder.status
                                        );

                                    const hasCompleteCost =
                                        detailOrder.items.every(
                                            (item) =>
                                                item.lineTotal !==
                                                null
                                        );

                                    const total =
                                        hasCompleteCost
                                            ? detailOrder.items.reduce(
                                                (
                                                    sum,
                                                    item
                                                ) =>
                                                    sum +
                                                    (
                                                        item.lineTotal ??
                                                        0
                                                    ),
                                                0
                                            )
                                            : null;

                                    return (
                                        <div className="space-y-6 p-4 sm:p-8 [&_dd]:break-words">
                                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                                <div>
                                                    <p className="text-sm text-slate-500">
                                                        Número de OC
                                                    </p>

                                                    <p className="mt-1 text-lg font-semibold text-slate-900">
                                                        {
                                                            detailOrder.purchaseOrderNumber
                                                        }
                                                    </p>
                                                </div>

                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ring-current/15 ${status.className}`}
                                                >
                                                    {
                                                        status.label
                                                    }
                                                </span>
                                            </div>

                                            <dl className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4 [&>div]:min-w-0">
                                                <div>
                                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Proveedor
                                                    </dt>

                                                    <dd className="mt-1 font-semibold text-slate-900">
                                                        {
                                                            detailOrder.supplierName
                                                        }
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Fecha de orden
                                                    </dt>

                                                    <dd className="mt-1 font-semibold text-slate-900">
                                                        {formatDate(
                                                            detailOrder.orderDate
                                                        )}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Entrega confirmada
                                                    </dt>

                                                    <dd className="mt-1 font-semibold text-slate-900">
                                                        {formatDate(
                                                            detailOrder.confirmedDeliveryDate
                                                        )}
                                                    </dd>
                                                </div>

                                                <div>
                                                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                        Moneda
                                                    </dt>

                                                    <dd className="mt-1 font-semibold text-slate-900">
                                                        {
                                                            detailOrder.currencyCode
                                                        }
                                                    </dd>
                                                </div>
                                            </dl>

                                            {detailOrder.notes && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-slate-900">
                                                        Notas
                                                    </h3>

                                                    <p className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                                        {
                                                            detailOrder.notes
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {detailOrder.status ===
                                                4 && (
                                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                                        <p className="text-sm font-semibold text-red-800">
                                                            Orden cancelada
                                                        </p>

                                                        {detailOrder.cancelledAt && (
                                                            <p className="mt-1 text-sm text-red-700">
                                                                Fecha:{" "}
                                                                {formatDate(
                                                                    detailOrder.cancelledAt
                                                                )}
                                                            </p>
                                                        )}

                                                        <p className="mt-2 text-sm text-red-700">
                                                            <span className="font-semibold">
                                                                Motivo:
                                                            </span>{" "}
                                                            {detailOrder.cancellationReason ??
                                                                "Sin motivo registrado"}
                                                        </p>
                                                    </div>
                                                )}

                                            <div>
                                                <div className="flex flex-wrap items-end justify-between gap-4">
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">
                                                            Productos
                                                        </h3>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {
                                                                detailOrder
                                                                    .items
                                                                    .length
                                                            }{" "}
                                                            renglones en esta orden
                                                        </p>
                                                    </div>

                                                    {total !==
                                                        null && (
                                                            <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-3 sm:text-right">
                                                                <p className="text-xs uppercase tracking-wide text-slate-500">
                                                                    Total
                                                                </p>

                                                                <p className="mt-1 text-2xl font-semibold tracking-tight text-sky-900 tabular-nums">
                                                                    {formatMoney(
                                                                        total,
                                                                        detailOrder.currencyCode
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>

                                                <div className="mt-4 space-y-3">
                                                    {detailOrder.items.map(
                                                        (
                                                            item
                                                        ) => (
                                                            <article
                                                                key={
                                                                    item.id
                                                                }
                                                                className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm [&_h4]:break-words"
                                                            >
                                                                <div className="flex flex-wrap justify-between gap-4">
                                                                    <div>
                                                                        <p className="font-mono text-xs font-semibold text-sky-700">
                                                                            {
                                                                                item.sku
                                                                            }
                                                                        </p>

                                                                        <h4 className="mt-1 font-semibold text-slate-900">
                                                                            {
                                                                                item.productName
                                                                            }
                                                                        </h4>

                                                                        {item.supplierProductCode && (
                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                Código proveedor:{" "}
                                                                                {
                                                                                    item.supplierProductCode
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {item.lineTotal !==
                                                                        null && (
                                                                            <p className="font-semibold text-slate-900">
                                                                                {formatMoney(
                                                                                    item.lineTotal,
                                                                                    detailOrder.currencyCode
                                                                                )}
                                                                            </p>
                                                                        )}
                                                                </div>

                                                                <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                                                                    <div>
                                                                        <dt className="text-xs text-slate-500">
                                                                            Unidad de compra
                                                                        </dt>

                                                                        <dd className="mt-1 font-medium text-slate-800">
                                                                            {
                                                                                item.purchaseUnit
                                                                            }
                                                                        </dd>
                                                                    </div>

                                                                    <div>
                                                                        <dt className="text-xs text-slate-500">
                                                                            Contenido
                                                                        </dt>

                                                                        <dd className="mt-1 font-medium text-slate-800">
                                                                            {
                                                                                item.unitsPerPackage
                                                                            }{" "}
                                                                            unidades
                                                                        </dd>
                                                                    </div>

                                                                    <div>
                                                                        <dt className="text-xs text-slate-500">
                                                                            Cantidad comprada
                                                                        </dt>

                                                                        <dd className="mt-1 font-medium text-slate-800">
                                                                            {
                                                                                item.orderedPurchaseQuantity
                                                                            }{" "}
                                                                            {
                                                                                item.purchaseUnit
                                                                            }
                                                                        </dd>
                                                                    </div>

                                                                    <div>
                                                                        <dt className="text-xs text-slate-500">
                                                                            Entrada a inventario
                                                                        </dt>

                                                                        <dd className="mt-1 font-semibold text-sky-800">
                                                                            {
                                                                                item.orderedStockQuantity
                                                                            }{" "}
                                                                            unidades
                                                                        </dd>
                                                                    </div>
                                                                </dl>

                                                                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                                                                    <p className="text-slate-600">
                                                                        Costo por unidad de compra:{" "}
                                                                        <span className="font-semibold text-slate-900">
                                                                            {item.purchaseUnitCost !==
                                                                                null
                                                                                ? formatMoney(
                                                                                    item.purchaseUnitCost,
                                                                                    detailOrder.currencyCode
                                                                                )
                                                                                : "No capturado"}
                                                                        </span>
                                                                    </p>
                                                                </div>
                                                            </article>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                        </div>
                    </div>
                )}
            {cancellingOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Cancelar orden de compra"
                >
                    <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div className="border-b border-slate-200 bg-linear-to-br from-white to-slate-50 px-6 py-6 sm:px-8">
                            <span aria-hidden="true" className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700">
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></svg>
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Cancelación
                            </p>

                            <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-slate-900">
                                Cancelar{" "}
                                {
                                    cancellingOrder.folio
                                }
                            </h2>

                            <p className="mt-4 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm leading-6 text-red-800">
                                Esta acción conservará la orden para consulta, pero ya no podrá editarse ni recibirse.
                            </p>
                        </div>

                        <div className="px-6 py-6 sm:px-8">
                            <label
                                htmlFor="cancellation-reason"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Motivo de cancelación
                            </label>
                            <p id="cancellation-reason-help" className="mt-1 text-sm leading-6 text-slate-500">Describe la causa para dejar constancia en la orden.</p>

                            <textarea
                                id="cancellation-reason"
                                aria-describedby="cancellation-reason-help cancellation-reason-count"
                                value={
                                    cancellationReason
                                }
                                onChange={(event) =>
                                    setCancellationReason(
                                        event.target.value
                                    )
                                }
                                maxLength={500}
                                rows={4}
                                disabled={cancelling}
                                placeholder="Ej. El proveedor informó que el producto está descontinuado."
                                className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                            />

                            <p id="cancellation-reason-count" className="mt-2 text-right text-xs text-slate-500 tabular-nums">
                                {
                                    cancellationReason.length
                                }
                                /500
                            </p>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
                            <button
                                type="button"
                                onClick={() => {
                                    setCancellingOrder(
                                        null
                                    );

                                    setCancellationReason(
                                        ""
                                    );
                                }}
                                disabled={cancelling}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m10 6-6 6 6 6M4 12h16" /></svg>
                                Volver
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void confirmCancellation()
                                }
                                disabled={
                                    cancelling ||
                                    !cancellationReason.trim()
                                }
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-700 bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:border-red-800 enabled:hover:bg-red-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></svg>
                                {cancelling
                                    ? "Cancelando..."
                                    : "Cancelar orden"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
