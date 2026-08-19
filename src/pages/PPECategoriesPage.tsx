import {
    useState,
    type FormEvent,
} from "react";

import {
    ppeCategoriesService,
} from "../api/services/PPECategoriesService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    usePPECategories,
} from "../hooks/usePPECategories";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const PPECategoriesPage = () => {
    const {
        categories,
        loading,
        error,
        refresh,
    } = usePPECategories();

    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole(
            "Administrator"
        );

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

            const trimmedName =
                name.trim();

            if (!trimmedName) {
                setFormError(
                    "El nombre de la categoría es obligatorio."
                );

                return;
            }

            setIsSubmitting(true);

            try {
                await ppeCategoriesService
                    .create({
                        name:
                            trimmedName,

                        description:
                            description.trim() ||
                            null,
                    });

                setName("");

                setDescription("");

                await refresh();
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        "No fue posible crear la categoría."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    return (
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        Catálogos
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Categorías EPP
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        Clasificación general de los equipos de protección personal.
                    </p>
                </div>
            </div>

            {isAdministrator && (
                <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Nueva categoría
                    </h2>

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6 grid gap-5 lg:grid-cols-2"
                    >
                        <div>
                            <label
                                htmlFor="category-name"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Nombre
                            </label>

                            <input
                                id="category-name"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. Proteccion ocular"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="category-description"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Descripción
                            </label>

                            <input
                                id="category-description"
                                value={
                                    description
                                }
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. Aquí puedes describir la categroia"
                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>

                        {formError && (
                            <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError}
                            </div>
                        )}

                        <div className="lg:col-span-2">
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting
                                }
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : "Crear categoría"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="font-semibold text-slate-900">
                        Categorías registradas
                    </h2>
                </div>

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando categorías...
                    </div>
                )}

                {!loading && error && (
                    <div className="p-6 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    categories.length === 0 && (
                        <div className="p-6 text-sm text-slate-500">
                            No hay categorías registradas.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    categories.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">
                                            Nombre
                                        </th>

                                        <th className="px-6 py-3">
                                            Descripción
                                        </th>

                                        <th className="px-6 py-3">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-200">
                                    {categories.map(
                                        (
                                            category
                                        ) => (
                                            <tr
                                                key={
                                                    category.id
                                                }
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-900">
                                                    {
                                                        category.name
                                                    }
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {category.description ??
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${category.isActive
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {category.isActive
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