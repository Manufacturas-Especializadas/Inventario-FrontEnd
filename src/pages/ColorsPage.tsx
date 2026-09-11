import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    colorsService,
} from "../api/services/colorsService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    useColors,
} from "../hooks/useColors";

import type {
    ProductColor,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

type StatusFilter =
    | "all"
    | "active"
    | "inactive";

const normalizeText = (
    value: string
) =>
    value
        .trim()
        .toLocaleLowerCase("es");

export const ColorsPage = () => {
    const {
        colors,
        loading,
        error,
        refresh,
    } = useColors();

    const {
        hasRole,
    } = useAuth();

    const isAdministrator =
        hasRole("Administrator");

    const [
        name,
        setName,
    ] = useState("");

    const [
        editingColorId,
        setEditingColorId,
    ] = useState<number | null>(
        null
    );

    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<StatusFilter>(
        "all"
    );

    const [
        formError,
        setFormError,
    ] = useState<string | null>(
        null
    );

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(
        null
    );

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<string | null>(
        null
    );

    const [
        isSubmitting,
        setIsSubmitting,
    ] = useState(false);

    const [
        changingStatusId,
        setChangingStatusId,
    ] = useState<number | null>(
        null
    );

    const summary =
        useMemo(() => {
            const active =
                colors.filter(
                    (color) =>
                        color.isActive
                ).length;

            return {
                total: colors.length,
                active,
                inactive:
                    colors.length -
                    active,
            };
        }, [colors]);

    const filteredColors =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(search);

            return colors
                .filter((color) => {
                    const matchesStatus =
                        statusFilter ===
                        "all" ||
                        (
                            statusFilter ===
                                "active"
                                ? color.isActive
                                : !color.isActive
                        );

                    const matchesSearch =
                        normalizeText(
                            color.name
                        ).includes(
                            normalizedSearch
                        );

                    return (
                        matchesStatus &&
                        matchesSearch
                    );
                })
                .sort(
                    (
                        first,
                        second
                    ) =>
                        Number(
                            second.isActive
                        ) -
                        Number(
                            first.isActive
                        ) ||
                        first.name.localeCompare(
                            second.name,
                            "es",
                            {
                                sensitivity:
                                    "base",
                            }
                        )
                );
        }, [
            colors,
            search,
            statusFilter,
        ]);

    const duplicateColor =
        useMemo(() => {
            const normalizedName =
                normalizeText(name);

            if (!normalizedName) {
                return undefined;
            }

            return colors.find(
                (color) =>
                    color.id !==
                    editingColorId &&
                    normalizeText(
                        color.name
                    ) ===
                    normalizedName
            );
        }, [
            colors,
            name,
            editingColorId,
        ]);

    const resetForm = () => {
        setName("");
        setEditingColorId(null);
        setFormError(null);
    };

    const startEditing = (
        color: ProductColor
    ) => {
        setEditingColorId(
            color.id
        );

        setName(
            color.name
        );

        setFormError(null);
        setActionError(null);
        setSuccessMessage(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const cancelEditing = () => {
        resetForm();
        setSuccessMessage(null);
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
    };

    const hasFilters =
        search.length > 0 ||
        statusFilter !== "all";

    const handleSubmit =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (
                !isAdministrator ||
                isSubmitting
            ) {
                return;
            }

            setFormError(null);
            setActionError(null);
            setSuccessMessage(null);

            const trimmedName =
                name.trim();

            if (!trimmedName) {
                setFormError(
                    "El nombre del color es obligatorio."
                );

                return;
            }

            if (duplicateColor) {
                setFormError(
                    `Ya existe un color llamado "${duplicateColor.name}".`
                );

                return;
            }

            setIsSubmitting(true);

            try {
                if (
                    editingColorId !==
                    null
                ) {
                    const updatedColor =
                        await colorsService
                            .update(
                                editingColorId,
                                {
                                    name:
                                        trimmedName,
                                }
                            );

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Color "${updatedColor.name}" actualizado correctamente.`
                    );
                } else {
                    const createdColor =
                        await colorsService
                            .create({
                                name:
                                    trimmedName,
                            });

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Color "${createdColor.name}" creado correctamente.`
                    );
                }
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        editingColorId !==
                            null
                            ? "No fue posible actualizar el color."
                            : "No fue posible crear el color."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const handleStatusChange =
        async (
            color: ProductColor
        ) => {
            if (
                !isAdministrator ||
                changingStatusId !==
                null
            ) {
                return;
            }

            setActionError(null);
            setSuccessMessage(null);

            setChangingStatusId(
                color.id
            );

            try {
                const updatedColor =
                    await colorsService
                        .setStatus(
                            color.id,
                            {
                                isActive:
                                    !color.isActive,
                            }
                        );

                await refresh();

                setSuccessMessage(
                    `Color "${updatedColor.name}" ${updatedColor.isActive
                        ? "activado"
                        : "desactivado"
                    } correctamente.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        color.isActive
                            ? "No fue posible desactivar el color."
                            : "No fue posible activar el color."
                    )
                );
            } finally {
                setChangingStatusId(
                    null
                );
            }
        };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Catálogos
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Colores de producto
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Administra los colores disponibles
                    para los productos de inventario.
                </p>
            </div>

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editingColorId !== null
                            ? "Editar color"
                            : "Nuevo color"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {editingColorId !== null
                            ? "Modifica el nombre del color seleccionado."
                            : "Registra un color que podrá utilizarse en los productos."}
                    </p>

                    {successMessage && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800"
                        >
                            {successMessage}
                        </div>
                    )}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6"
                    >
                        <div>
                            <label
                                htmlFor="color-name"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Nombre
                            </label>

                            <input
                                id="color-name"
                                value={name}
                                onChange={(
                                    event
                                ) => {
                                    setName(
                                        event
                                            .target
                                            .value
                                    );

                                    setFormError(
                                        null
                                    );

                                    setSuccessMessage(
                                        null
                                    );
                                }}
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. Negro, Azul, Rojo, Amarillo"
                                autoComplete="off"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />

                            {duplicateColor && (
                                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                                    Ya existe el color "
                                    {
                                        duplicateColor.name
                                    }
                                    ".
                                </p>
                            )}
                        </div>

                        {formError && (
                            <div
                                role="alert"
                                className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700"
                            >
                                {formError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                            {editingColorId !==
                                null && (
                                    <button
                                        type="button"
                                        onClick={
                                            cancelEditing
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                                    >
                                        Cancelar
                                    </button>
                                )}

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    Boolean(
                                        duplicateColor
                                    )
                                }
                                className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : editingColorId !==
                                        null
                                        ? "Guardar cambios"
                                        : "Crear Color"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <dl className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                    <dt className="text-sm text-slate-600">
                        Total
                    </dt>

                    <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {loading
                            ? "…"
                            : summary.total}
                    </dd>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                    <dt className="text-sm text-slate-600">
                        Activas
                    </dt>

                    <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {loading
                            ? "…"
                            : summary.active}
                    </dd>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                    <dt className="text-sm text-slate-600">
                        Inactivas
                    </dt>

                    <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {loading
                            ? "…"
                            : summary.inactive}
                    </dd>
                </div>
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Colores registrados
                            </h2>

                            {!loading &&
                                !error && (
                                    <p className="mt-1 text-sm text-slate-500">
                                        {
                                            filteredColors.length
                                        }{" "}
                                        {filteredColors.length ===
                                            1
                                            ? "resultado"
                                            : "resultados"}
                                    </p>
                                )}
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="color-search"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Buscar
                            </label>

                            <input
                                id="color-search"
                                type="search"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Nombre del color"
                                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none sm:text-sm"
                            />
                        </div>

                        <div className="sm:w-48 sm:shrink-0">
                            <label
                                htmlFor="color-status"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Estado
                            </label>

                            <select
                                id="color-status"
                                value={
                                    statusFilter
                                }
                                onChange={(
                                    event
                                ) =>
                                    setStatusFilter(
                                        event
                                            .target
                                            .value as StatusFilter
                                    )
                                }
                                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none sm:text-sm"
                            >
                                <option value="all">
                                    Todas
                                </option>

                                <option value="active">
                                    Activas
                                </option>

                                <option value="inactive">
                                    Inactivas
                                </option>
                            </select>
                        </div>

                        {hasFilters && (
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={
                                        clearFilters
                                    }
                                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none sm:w-auto"
                                >
                                    Limpiar
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {actionError && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando colores...
                    </div>
                )}

                {!loading &&
                    error && (
                        <div className="p-6 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    colors.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay colores
                            registrados.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    colors.length > 0 &&
                    filteredColors.length ===
                    0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay colores que
                            coincidan con los
                            filtros.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredColors.length >
                    0 && (
                        <div
                            className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
                            tabIndex={0}
                            role="region"
                            aria-label="Colores registrados"
                        >
                            <table className="w-full min-w-150 text-left text-sm">
                                <thead className="bg-sky-50/80 text-xs uppercase text-sky-800">
                                    <tr>
                                        <th className="px-6 py-4">
                                            Nombre
                                        </th>

                                        <th className="px-6 py-4">
                                            Estado
                                        </th>

                                        {isAdministrator && (
                                            <th className="px-6 py-4 text-right">
                                                Acciones
                                            </th>
                                        )}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredColors.map(
                                        (
                                            color
                                        ) => (
                                            <tr
                                                key={
                                                    color.id
                                                }
                                                className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-6 py-5 font-semibold text-slate-900">
                                                    {
                                                        color.name
                                                    }
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${color.isActive
                                                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                            : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        {color.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>

                                                {isAdministrator && (
                                                    <td className="px-6 py-5">
                                                        <div className="ml-auto grid w-40 grid-cols-1 gap-2 sm:w-72 sm:grid-cols-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    startEditing(
                                                                        color
                                                                    )
                                                                }
                                                                disabled={
                                                                    isSubmitting ||
                                                                    changingStatusId !==
                                                                    null
                                                                }
                                                                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                            >
                                                                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z" /></svg>
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleStatusChange(
                                                                        color
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingStatusId !==
                                                                    null ||
                                                                    isSubmitting
                                                                }
                                                                className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${color.isActive
                                                                    ? "border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:border-amber-300 enabled:hover:bg-amber-100 focus-visible:ring-amber-100"
                                                                    : "border-emerald-200 bg-emerald-50 text-emerald-800 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus-visible:ring-emerald-100"
                                                                    }`}
                                                            >
                                                                {changingStatusId ===
                                                                    color.id
                                                                    ? "Guardando..."
                                                                    : color.isActive
                                                                        ? "Desactivar"
                                                                        : "Activar"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
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
