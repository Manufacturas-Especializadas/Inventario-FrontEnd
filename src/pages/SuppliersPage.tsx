import {
    useState,
    type FormEvent,
} from "react";

import {
    suppliersService,
} from "../api/services/SuppliersService";

import {
    useSuppliers,
} from "../hooks/useSuppliers";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const SuppliersPage = () => {
    const {
        suppliers,
        loading,
        error,
        refresh,
    } = useSuppliers();

    const [
        name,
        setName,
    ] = useState("");

    const [
        formError,
        setFormError,
    ] = useState<string | null>(
        null
    );

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);

            const supplierName =
                name.trim();

            if (!supplierName) {
                setFormError(
                    "El nombre del proveedor es obligatorio."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await suppliersService.create({
                    name: supplierName,
                });

                setName("");

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible crear el proveedor."
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
                    Catálogos
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Proveedores
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Administra los proveedores
                    disponibles para la compra de
                    equipo de protección personal.
                </p>
            </div>

            {/* Alta */}
            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Nuevo proveedor
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Registra un proveedor para
                        posteriormente asociarlo con
                        sus productos.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6"
                >
                    <div className="max-w-xl">
                        <label
                            htmlFor="supplier-name"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Nombre del proveedor
                        </label>

                        <input
                            id="supplier-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            disabled={
                                isSubmitting
                            }
                            placeholder="Ej. Proveedor Industrial S.A. de C.V."
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                        />
                    </div>

                    {formError && (
                        <div className="mt-4 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting
                            ? "Guardando..."
                            : "Crear proveedor"}
                    </button>
                </form>
            </section>

            {/* Lista */}
            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Proveedores registrados
                        </h2>

                        {!loading &&
                            !error && (
                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        suppliers.length
                                    }{" "}
                                    proveedor
                                    {suppliers.length !==
                                        1
                                        ? "es"
                                        : ""}
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
                        Cargando proveedores...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    suppliers.length ===
                    0 && (
                        <div className="p-8 text-center">
                            <p className="font-medium text-slate-700">
                                No hay proveedores
                                registrados.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Registra el primero
                                utilizando el
                                formulario superior.
                            </p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    suppliers.length >
                    0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">
                                            ID
                                        </th>

                                        <th className="px-6 py-3">
                                            Proveedor
                                        </th>

                                        <th className="px-6 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {suppliers.map(
                                        (
                                            supplier
                                        ) => (
                                            <tr
                                                key={
                                                    supplier.id
                                                }
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4 text-slate-500">
                                                    {
                                                        supplier.id
                                                    }
                                                </td>

                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {
                                                        supplier.name
                                                    }
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${supplier.isActive
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {supplier.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
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