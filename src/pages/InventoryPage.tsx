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
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Almacén
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Inventario EPP
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Consulta existencias,
                    cantidades reservadas y
                    disponibilidad de los productos.
                </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Productos
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {summary.products}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Existencia física
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {summary.onHand}
                    </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                        Disponible
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                        {summary.available}
                    </p>
                </div>

                <div
                    className={`rounded-xl border p-5 shadow-sm ${summary.lowStock > 0
                            ? "border-red-200 bg-red-50"
                            : "border-emerald-200 bg-emerald-50"
                        }`}
                >
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

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[280px_1fr_auto]">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Almacén
                        </label>

                        <select
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
                        <label className="block text-sm font-medium text-slate-700">
                            Buscar
                        </label>

                        <input
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
                        <label className="flex h-10.5 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700">
                            <input
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

            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Existencias
                        </h2>

                        {!loading &&
                            !error && (
                                <p className="mt-1 text-xs text-slate-500">
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
                    <div className="p-6 text-sm text-slate-500">
                        Cargando inventario...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredBalances.length ===
                    0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No existen registros
                            de inventario con
                            estos filtros.
                        </div>
                    )}


                {!loading &&
                    !error &&
                    filteredBalances.length >
                    0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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

                                <tbody className="divide-y divide-slate-200">
                                    {filteredBalances.map(
                                        (
                                            balance
                                        ) => (
                                            <tr
                                                key={`${balance.warehouseId}-${balance.ppeProductId}`}
                                                className="hover:bg-slate-50"
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
