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
        <div className="mx-auto max-w-7xl">
            <div>
                <p className="text-sm font-medium text-slate-500">
                    Configuración
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    Almacenes
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Administra los almacenes utilizados
                    para el control de inventario.
                </p>
            </div>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    Nuevo almacén
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 grid gap-5 md:grid-cols-2"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Código
                        </label>

                        <input
                            type="text"
                            value={code}
                            onChange={(event) =>
                                setCode(
                                    event.target.value
                                )
                            }
                            placeholder="Ej. ALM-EPP"
                            disabled={isSubmitting}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Nombre
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(
                                    event.target.value
                                )
                            }
                            placeholder="Ej. Almacén EPP"
                            disabled={isSubmitting}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Descripción
                        </label>

                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                            placeholder="Descripción opcional del almacén"
                            rows={3}
                            disabled={isSubmitting}
                            className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                        />
                    </div>

                    {formError && (
                        <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Guardando..."
                                : "Crear almacén"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Almacenes registrados
                        </h2>

                        {!loading && !error && (
                            <p className="mt-1 text-xs text-slate-500">
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
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Actualizar
                    </button>
                </div>

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando almacenes...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    warehouses.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay almacenes registrados.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    warehouses.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-5 py-3">
                                            Código
                                        </th>

                                        <th className="px-5 py-3">
                                            Nombre
                                        </th>

                                        <th className="px-5 py-3">
                                            Descripción
                                        </th>

                                        <th className="px-5 py-3">
                                            Estado
                                        </th>

                                        <th className="px-5 py-3">
                                            Creado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {warehouses.map(
                                        (warehouse) => (
                                            <tr
                                                key={
                                                    warehouse.id
                                                }
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 font-mono text-xs font-medium">
                                                    {
                                                        warehouse.code
                                                    }
                                                </td>

                                                <td className="px-5 py-4 font-medium text-slate-900">
                                                    {
                                                        warehouse.name
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
                                                    {warehouse.description ??
                                                        "—"}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${warehouse.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {warehouse.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
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