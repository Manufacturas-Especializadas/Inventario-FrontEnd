import {
    useState,
    type FormEvent,
} from "react";

import {
    warehousesService,
} from "../api/services/WarehousesService";

import {
    useWarehouses,
} from "../hooks/useWarehouses";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const WarehousesPage = () => {
    const {
        warehouses,
        loading,
        error,
        refresh,
    } = useWarehouses();

    const [
        code,
        setCode,
    ] = useState("");

    const [
        name,
        setName,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [
        formError,
        setFormError,
    ] = useState<string | null>(null);

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const resetForm = () => {
        setCode("");
        setName("");
        setDescription("");
    };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(null);

            const normalizedCode =
                code.trim();

            const normalizedName =
                name.trim();

            if (!normalizedCode) {
                setFormError(
                    "El código del almacén es obligatorio."
                );

                return;
            }

            if (!normalizedName) {
                setFormError(
                    "El nombre del almacén es obligatorio."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await warehousesService.create({
                    code: normalizedCode,
                    name: normalizedName,

                    description:
                        description.trim() ||
                        null,
                });

                resetForm();

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible crear el almacén."
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
                    MESA · Configuración
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Almacenes
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                    Administra los almacenes utilizados
                    para el control de inventario.
                </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-6 9 6v12H3V9ZM7 21V11h10v10M7 15h10M7 18h10" />
                        </svg>
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Nuevo almacén
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            Registra los datos del almacén para identificarlo en tu inventario.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-7 grid gap-6 md:grid-cols-2"
                >
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3 md:col-span-2">
                        <span aria-hidden="true" className="text-xs font-semibold text-sky-700">01</span>
                        <h3 className="text-sm font-semibold text-slate-800">Datos del almacén</h3>
                    </div>
                    <div className="min-w-0">
                        <label htmlFor="warehouse-code" className="block text-sm font-medium text-slate-700">
                            Código
                        </label>

                        <input
                            id="warehouse-code"
                            type="text"
                            value={code}
                            onChange={(event) =>
                                setCode(
                                    event.target.value
                                )
                            }
                            placeholder="Ej. ALM-PROD"
                            disabled={isSubmitting}
                            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                        />
                    </div>

                    <div className="min-w-0">
                        <label htmlFor="warehouse-name" className="block text-sm font-medium text-slate-700">
                            Nombre
                        </label>

                        <input
                            id="warehouse-name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            placeholder="Ej. Almacén de sistemas"
                            disabled={isSubmitting}
                            className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label htmlFor="warehouse-description" className="block text-sm font-medium text-slate-700">
                            Descripción
                            <span className="ml-2 text-xs font-normal text-slate-500">Opcional</span>
                        </label>

                        <textarea
                            id="warehouse-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Descripción opcional del almacén"
                            rows={3}
                            disabled={isSubmitting}
                            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                        />
                    </div>

                    {formError && (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
                            {formError}
                        </div>
                    )}

                    <div className="flex justify-end border-t border-slate-100 pt-6 md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : "Crear almacén"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Almacenes registrados
                        </h2>

                        {!loading && !error && (
                            <p className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-100">
                                {warehouses.length} almacenes
                            </p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void refresh()
                        }
                        disabled={loading}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                    >
                        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
                        </svg>
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div role="status" className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800">
                        <span aria-hidden="true" className="mx-auto mb-3 block h-6 w-6 rounded-full border-2 border-sky-200 border-t-sky-700 motion-safe:animate-spin" />
                        Cargando almacenes...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    warehouses.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 9 9-6 9 6v12H3V9ZM7 21V11h10v10M7 15h10M7 18h10" />
                            </svg>
                            <p className="text-sm font-semibold text-slate-900">No hay almacenes registrados.</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Crea tu primer almacén utilizando el formulario superior.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    warehouses.length > 0 && (
                        <div tabIndex={0} role="region" aria-label="Almacenes registrados" className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-600">
                            <table className="w-full min-w-190 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th scope="col" className="px-5 py-3">
                                            Código
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Nombre
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Descripción
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Estado
                                        </th>

                                        <th scope="col" className="px-5 py-3">
                                            Creado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {warehouses.map(
                                        (warehouse) => (
                                            <tr
                                                key={
                                                    warehouse.id
                                                }
                                                className="transition-colors duration-150 hover:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="max-w-48 wrap-break-word px-5 py-4 font-mono text-xs font-semibold text-slate-900">
                                                    {
                                                        warehouse.code
                                                    }
                                                </td>

                                                <td className="max-w-64 wrap-break-word px-5 py-4 font-medium text-slate-900">
                                                    {
                                                        warehouse.name
                                                    }
                                                </td>

                                                <td className="max-w-sm wrap-break-word px-5 py-4 leading-6 text-slate-600">
                                                    {warehouse.description ??
                                                        "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-current/15 ${warehouse.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {warehouse.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 tabular-nums text-slate-600">
                                                    {new Date(
                                                        warehouse.createdAt
                                                    ).toLocaleDateString(
                                                        "es-MX"
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
