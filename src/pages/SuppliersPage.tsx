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
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Catálogos
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Proveedores
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Administra los proveedores de artículos, materiales y recursos para la operación de MESA.
                </p>
            </div>

            {/* Alta */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4h6v4M9 7h1m4 0h1M9 11h1m4 0h1" /></svg>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Nuevo proveedor
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Registra un proveedor para
                            posteriormente asociarlo con
                            sus productos.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7 grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                >
                    <div className="min-w-0">
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
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                        />
                    </div>

                    {formError && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 sm:row-start-2">
                            {formError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={
                            isSubmitting
                        }
                        className="min-h-12.5 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:col-start-2 sm:row-start-1 sm:w-auto"
                    >
                        {isSubmitting
                            ? "Guardando..."
                            : "Crear proveedor"}
                    </button>
                </form>
            </section>

            {/* Lista */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Proveedores registrados
                        </h2>

                        {!loading &&
                            !error && (
                                <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
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
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition duration-200 enabled:hover:border-sky-400 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:ring-offset-2 enabled:active:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" /></svg>
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div role="status" className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        Cargando proveedores...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    suppliers.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4h6v4M9 7h1m4 0h1M9 11h1m4 0h1" /></svg>
                            <p className="text-sm font-semibold text-slate-900">
                                No hay proveedores
                                registrados.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
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
                        <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600" tabIndex={0} role="region" aria-label="Proveedores registrados">
                            <table className="w-full min-w-120 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th scope="col" className="w-24 px-6 py-4 sm:px-8">
                                            ID
                                        </th>

                                        <th scope="col" className="px-6 py-4 sm:px-8">
                                            Proveedor
                                        </th>

                                        <th scope="col" className="w-36 px-6 py-4 sm:px-8">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {suppliers.map(
                                        (
                                            supplier
                                        ) => (
                                            <tr
                                                key={
                                                    supplier.id
                                                }
                                                className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-6 py-5 font-mono text-xs tabular-nums text-sky-800 sm:px-8">
                                                    {
                                                        supplier.id
                                                    }
                                                </td>

                                                <td className="max-w-md wrap-break-word px-6 py-5 font-semibold text-slate-900 sm:px-8">
                                                    {
                                                        supplier.name
                                                    }
                                                </td>

                                                <td className="px-6 py-5 sm:px-8">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${supplier.isActive
                                                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                            : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
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
