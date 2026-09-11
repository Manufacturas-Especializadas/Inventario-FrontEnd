import {
    useMemo,
    useState,
} from "react";

import {
    useInventory,
} from "../hooks/useInventory";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

export const InventoryPage = () => {
    const [
        warehouseId,
        setWarehouseId,
    ] = useState("");

    const [
        searchTerm,
        setSearchTerm,
    ] = useState("");

    const [
        onlyLowStock,
        setOnlyLowStock,
    ] = useState(false);

    const selectedWarehouseId =
        warehouseId
            ? Number(warehouseId)
            : null;

    const {
        balances,
        loading,
        error,
        refresh,
    } = useInventory(
        selectedWarehouseId
    );

    const {
        warehouses,
        loading: loadingWarehouses,
    } = useWarehouses();


    const filteredBalances =
        useMemo(() => {
            const term =
                searchTerm
                    .trim()
                    .toLowerCase();

            return balances.filter(
                (balance) => {
                    if (
                        onlyLowStock &&
                        !balance.isLowStock
                    ) {
                        return false;
                    }

                    if (!term) {
                        return true;
                    }

                    return (
                        balance.sku
                            .toLowerCase()
                            .includes(term) ||

                        balance.productName
                            .toLowerCase()
                            .includes(term) ||

                        balance.categoryName
                            .toLowerCase()
                            .includes(term) ||

                        balance.warehouseName
                            .toLowerCase()
                            .includes(term)
                    );
                }
            );
        }, [
            balances,
            searchTerm,
            onlyLowStock,
        ]);

    const summary =
        useMemo(() => {
            return {
                products:
                    balances.length,

                onHand:
                    balances.reduce(
                        (total, item) =>
                            total +
                            item.onHandQuantity,
                        0
                    ),

                available:
                    balances.reduce(
                        (total, item) =>
                            total +
                            item.availableQuantity,
                        0
                    ),

                lowStock:
                    balances.filter(
                        (item) =>
                            item.isLowStock
                    ).length,
            };
        }, [balances]);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Almacén
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Inventario general
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Consulta existencias,
                    cantidades reservadas y
                    disponibilidad de los productos.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="min-w-0 rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-sky-50 p-2 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9" /></svg>
                    <p className="text-sm font-medium text-slate-600">
                        Productos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {summary.products}
                    </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-sky-200 bg-white p-6 shadow-sm">
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-sky-50 p-2 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13M7 21V11h10v10M7 15h10M7 18h10" /></svg>
                    <p className="text-sm font-medium text-slate-600">
                        Existencia física
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {summary.onHand}
                    </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-sky-700 bg-sky-700 p-6 text-white shadow-sm">
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-white/15 p-2 text-sky-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
                    <p className="text-sm font-medium text-sky-100">
                        Disponible
                    </p>

                    <p className="mt-2 wrap-break-word text-3xl font-semibold tracking-tight text-white tabular-nums">
                        {summary.available}
                    </p>
                </div>

                <div
                    className={`min-w-0 rounded-2xl border p-6 shadow-sm ${summary.lowStock > 0
                        ? "border-red-200 bg-red-50"
                        : "border-emerald-200 bg-emerald-50"
                        }`}
                >
                    <svg aria-hidden="true" className="mb-4 h-10 w-10 rounded-xl bg-white/70 p-2 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
                    <p
                        className={`text-sm ${summary.lowStock > 0
                            ? "text-red-600"
                            : "text-emerald-600"
                            }`}
                    >
                        {summary.lowStock > 0
                            ? "Productos con stock bajo"
                            : "Stock en buen estado"}
                    </p>

                    <p
                        className={`mt-2 text-2xl font-bold ${summary.lowStock > 0
                            ? "text-red-700"
                            : "text-emerald-700"
                            }`}
                    >
                        {summary.lowStock}
                    </p>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /></svg></span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Consulta de inventario</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Filtra por almacén, busca artículos o revisa los productos con stock bajo.</p>
                    </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] [&>div]:min-w-0">
                    <div>
                        <label htmlFor="inventory-warehouse" className="block text-sm font-medium text-slate-700">
                            Almacén
                        </label>

                        <select
                            id="inventory-warehouse"
                            value={warehouseId}
                            onChange={(event) =>
                                setWarehouseId(
                                    event.target.value
                                )
                            }
                            disabled={
                                loadingWarehouses
                            }
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                Todos los almacenes
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
                        <label htmlFor="inventory-search" className="block text-sm font-medium text-slate-700">
                            Buscar
                        </label>

                        <input
                            id="inventory-search"
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            placeholder="SKU, producto, categoría..."
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="flex items-end">
                        <label className="flex min-h-12.5 w-full cursor-pointer items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/60 px-4 py-3 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100/60 focus-within:ring-4 focus-within:ring-sky-100 motion-reduce:transition-none">
                            <input
                                className="h-5 w-5 shrink-0 accent-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
                                type="checkbox"
                                checked={
                                    onlyLowStock
                                }
                                onChange={(
                                    event
                                ) =>
                                    setOnlyLowStock(
                                        event
                                            .target
                                            .checked
                                    )
                                }
                            />

                            Solo stock bajo
                        </label>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Existencias
                        </h2>

                        {!loading &&
                            !error && (
                                <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
                                    {
                                        filteredBalances.length
                                    }{" "}
                                    registros
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
                        Cargando inventario...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredBalances.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center text-sm leading-6 text-slate-600">
                            No existen registros
                            de inventario con
                            estos filtros.
                        </div>
                    )}


                {!loading &&
                    !error &&
                    filteredBalances.length >
                    0 && (
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Existencias de inventario">
                            <table className="w-full min-w-270 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th className="px-5 py-3">
                                            Almacén
                                        </th>

                                        <th className="px-5 py-3">
                                            SKU
                                        </th>

                                        <th className="px-5 py-3">
                                            Producto
                                        </th>

                                        <th className="px-5 py-3">
                                            Categoría
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Existencia
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Reservado
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Disponible
                                        </th>

                                        <th className="px-5 py-3 text-right">
                                            Mínimo
                                        </th>

                                        <th className="px-5 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredBalances.map(
                                        (
                                            balance
                                        ) => (
                                            <tr
                                                key={`${balance.warehouseId}-${balance.ppeProductId}`}
                                                className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            balance.warehouseCode
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {
                                                            balance.warehouseName
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 font-mono text-xs font-semibold">
                                                    {
                                                        balance.sku
                                                    }
                                                </td>

                                                <td className="px-5 py-4 font-medium text-slate-900">
                                                    {
                                                        balance.productName
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
                                                    {
                                                        balance.categoryName
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-right font-semibold">
                                                    {
                                                        balance.onHandQuantity
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-right text-amber-700">
                                                    {
                                                        balance.reservedQuantity
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-right font-bold text-slate-900">
                                                    {
                                                        balance.availableQuantity
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-right text-slate-600">
                                                    {
                                                        balance.minimumStock
                                                    }
                                                </td>

                                                <td className="px-5 py-4">
                                                    {balance.isLowStock ? (
                                                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                                            Stock bajo
                                                        </span>
                                                    ) : (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                                            Disponible
                                                        </span>
                                                    )}
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
