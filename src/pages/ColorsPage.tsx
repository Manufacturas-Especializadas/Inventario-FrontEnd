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

import { StatCard } from "../components/ui/StatCard";
import { ActiveStatusBadge } from "../components/ui/ActiveStatusBadge";
import { CatalogStatusFilters } from "../components/catalogs/CatalogStatusFilters";
import { CatalogNameForm } from "../components/catalogs/CatalogNameForm";
import { CatalogRowActions } from "../components/catalogs/CatalogRowActions";
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";
import { PageHeader } from "../components/ui/PageHeader";

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
        hasLoaded,
        upsertColor,
    } = useColors();

    const [isFormOpen, setIsFormOpen] = useState(false);

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

        setIsFormOpen(true);
    };

    const cancelEditing = () => {
        if (isSubmitting) return;
        resetForm();
        setSuccessMessage(null);
        setIsFormOpen(false);
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

                    upsertColor(updatedColor);

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

                    upsertColor(createdColor);

                    resetForm();

                    setSuccessMessage(
                        `Color "${createdColor.name}" creado correctamente.`
                    );
                }
                setIsFormOpen(false);
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

                upsertColor(updatedColor);

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
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Colores de producto"
                description="Administra los colores disponibles para los productos de inventario."
            />

            {isAdministrator && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setActionError(null);
                            setSuccessMessage(null);
                            setIsFormOpen(true);
                        }}
                        aria-haspopup="dialog"
                        aria-controls="color-form-modal"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none sm:w-auto"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nuevo color
                    </button>
                </div>
            )}

            {successMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                    {successMessage}
                </div>
            )}

            <dl className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                <StatCard label="Total" value={loading ? "…" : error || !hasLoaded ? "—" : summary.total} />
                <StatCard label="Activos" value={loading ? "…" : error || !hasLoaded ? "—" : summary.active} />
                <StatCard label="Inactivos" value={loading ? "…" : error || !hasLoaded ? "—" : summary.inactive} />
            </dl>

            <section id="colors-list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Colores registrados</h2>
                            {!loading && hasLoaded && !error && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredColors.length} {filteredColors.length === 1 ? "resultado" : "resultados"}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            disabled={loading}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9" />
                            </svg>
                            Actualizar
                        </button>
                    </div>

                    <CatalogStatusFilters
                        searchId="color-search"
                        statusId="color-status"
                        search={search}
                        searchPlaceholder="Nombre del color"
                        status={statusFilter}
                        onSearchChange={(
                            event
                        ) =>
                            setSearch(
                                event
                                    .target
                                    .value
                            )
                        }
                        onStatusChange={(
                            event
                        ) =>
                            setStatusFilter(
                                event
                                    .target
                                    .value as StatusFilter
                            )
                        }
                        showClear={hasFilters}
                        onClear={clearFilters}
                    />
                </div>

                {actionError && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {loading && <CatalogLoadingSkeleton label="Cargando colores" />}
                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm leading-6 text-red-700 sm:mx-8">
                        <p className="font-semibold">No fue posible cargar el listado.</p>
                        <p className="mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            className="mt-4 min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 motion-reduce:transition-none"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && hasLoaded && !error && colors.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay colores registrados.
                    </div>
                )}

                {!loading && hasLoaded && !error && colors.length > 0 && filteredColors.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay colores que coincidan con los filtros.
                    </div>
                )}

                {!loading && hasLoaded && !error && filteredColors.length > 0 && (
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
                                                <ActiveStatusBadge isActive={color.isActive} />
                                            </td>

                                            {isAdministrator && (
                                                <td className="px-6 py-5">
                                                    <CatalogRowActions
                                                        isActive={color.isActive}
                                                        isChanging={changingStatusId === color.id}
                                                        disabled={isSubmitting || changingStatusId !== null}
                                                        onEdit={() => startEditing(color)}
                                                        onToggleStatus={() => void handleStatusChange(color)}
                                                    />
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

            {isAdministrator && isFormOpen && (
                <CatalogFormModal
                    id="color-form-modal"
                    title={editingColorId !== null ? "Editar color" : "Nuevo color"}
                    description={editingColorId !== null
                        ? "Modifica el nombre del color seleccionado."
                        : "Registra un color que podrá utilizarse en los productos."}
                    isSubmitting={isSubmitting}
                    onClose={cancelEditing}
                >
                    <CatalogNameForm
                        inputId="color-name"
                        name={name}
                        placeholder="Ej. Negro, Azul, Rojo, Amarillo"
                        onNameChange={(event) => {
                            setName(event.target.value);
                            setFormError(null);
                            setSuccessMessage(null);
                        }}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        duplicateMessage={duplicateColor
                            ? `Ya existe el color "${duplicateColor.name}".`
                            : null}
                        errorMessage={formError}
                        showCancel={true}
                        onCancel={cancelEditing}
                        submitDisabled={isSubmitting || Boolean(duplicateColor)}
                        submitLabel={isSubmitting
                            ? "Guardando..."
                            : editingColorId !== null
                                ? "Guardar cambios"
                                : "Crear Color"}
                    />
                </CatalogFormModal>
            )}
        </div>
    );
};
