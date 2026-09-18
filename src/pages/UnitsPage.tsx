import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    unitsService,
} from "../api/services/unitsService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    useUnits,
} from "../hooks/useUnits";

import type {
    UnitOfMeasure,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

import { StatCard } from "../components/ui/StatCard";
import { ActiveStatusBadge } from "../components/ui/ActiveStatusBadge";
import { CatalogRowActions } from "../components/catalogs/CatalogRowActions";
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { CatalogStatusFilters } from "../components/catalogs/CatalogStatusFilters";
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

export const UnitsPage = () => {
    const {
        units,
        loading,
        error,
        refresh,
        hasLoaded,
        upsertUnit,
    } = useUnits();

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
        symbol,
        setSymbol,
    ] = useState("");

    const [
        editingUnitId,
        setEditingUnitId,
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
                units.filter(
                    (unit) =>
                        unit.isActive
                ).length;

            return {
                total: units.length,
                active,
                inactive:
                    units.length -
                    active,
            };
        }, [units]);

    const filteredUnits =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(search);

            return units
                .filter((unit) => {
                    const matchesStatus =
                        statusFilter ===
                        "all" ||
                        (
                            statusFilter ===
                                "active"
                                ? unit.isActive
                                : !unit.isActive
                        );

                    const matchesSearch =
                        normalizeText(
                            unit.name
                        ).includes(
                            normalizedSearch
                        ) ||
                        normalizeText(
                            unit.symbol ?? ""
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
            units,
            search,
            statusFilter,
        ]);

    const duplicateUnit =
        useMemo(() => {
            const normalizedName =
                normalizeText(name);

            if (!normalizedName) {
                return undefined;
            }

            return units.find(
                (unit) =>
                    unit.id !==
                    editingUnitId &&
                    normalizeText(
                        unit.name
                    ) ===
                    normalizedName
            );
        }, [
            units,
            name,
            editingUnitId,
        ]);

    const resetForm = () => {
        setName("");
        setSymbol("");
        setEditingUnitId(null);
        setFormError(null);
    };

    const startEditing = (
        unit: UnitOfMeasure
    ) => {
        setEditingUnitId(
            unit.id
        );

        setName(
            unit.name
        );

        setSymbol(
            unit.symbol ?? ""
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

            const trimmedSymbol =
                symbol.trim();

            if (!trimmedName) {
                setFormError(
                    "El nombre de la unidad es obligatorio."
                );

                return;
            }

            if (duplicateUnit) {
                setFormError(
                    `Ya existe una unidad llamada "${duplicateUnit.name}".`
                );

                return;
            }

            setIsSubmitting(true);

            try {
                if (
                    editingUnitId !==
                    null
                ) {
                    const updatedUnit =
                        await unitsService
                            .update(
                                editingUnitId,
                                {
                                    name:
                                        trimmedName,

                                    symbol:
                                        trimmedSymbol ||
                                        null,
                                }
                            );

                    upsertUnit(updatedUnit);

                    resetForm();

                    setSuccessMessage(
                        `Unidad "${updatedUnit.name}" actualizada correctamente.`
                    );
                } else {
                    const createdUnit =
                        await unitsService
                            .create({
                                name:
                                    trimmedName,

                                symbol:
                                    trimmedSymbol ||
                                    null,
                            });

                    upsertUnit(createdUnit);

                    resetForm();

                    setSuccessMessage(
                        `Unidad "${createdUnit.name}" creada correctamente.`
                    );
                }
                setIsFormOpen(false);
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        editingUnitId !==
                            null
                            ? "No fue posible actualizar la unidad."
                            : "No fue posible crear la unidad."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const handleStatusChange =
        async (
            unit: UnitOfMeasure
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
                unit.id
            );

            try {
                const updatedUnit =
                    await unitsService
                        .setStatus(
                            unit.id,
                            {
                                isActive:
                                    !unit.isActive,
                            }
                        );

                upsertUnit(updatedUnit);

                setSuccessMessage(
                    `Unidad "${updatedUnit.name}" ${updatedUnit.isActive
                        ? "activada"
                        : "desactivada"
                    } correctamente.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        unit.isActive
                            ? "No fue posible desactivar la unidad."
                            : "No fue posible activar la unidad."
                    )
                );
            } finally {
                setChangingStatusId(
                    null
                );
            }
        };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
    };

    const hasFilters =
        search.length > 0 ||
        statusFilter !== "all";

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Unidades de medida"
                description="Administra las unidades utilizadas para controlar inventario y las presentaciones de compra de los productos."
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
                        aria-controls="unit-form-modal"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none sm:w-auto"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nueva unidad de medida
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

            <section id="units-list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Unidades registradas</h2>
                            {!loading && hasLoaded && !error && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredUnits.length} {filteredUnits.length === 1 ? "resultado" : "resultados"}
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
                        searchId="unit-search"
                        statusId="unit-status"
                        search={search}
                        searchPlaceholder="Nombre o símbolo"
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

                {loading && <CatalogLoadingSkeleton label="Cargando unidades" />}
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

                {!loading && hasLoaded && !error && units.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay unidades registradas.
                    </div>
                )}

                {!loading && hasLoaded && !error && units.length > 0 && filteredUnits.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay unidades que coincidan con los filtros.
                    </div>
                )}

                {!loading && hasLoaded && !error && filteredUnits.length > 0 && (
                    <div
                        className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
                        tabIndex={0}
                        role="region"
                        aria-label="Unidades registradas"
                    >
                        <table className="w-full min-w-180 text-left text-sm">
                            <thead className="bg-sky-50/80 text-xs uppercase text-sky-800">
                                <tr>
                                    <th className="px-6 py-4">
                                        Nombre
                                    </th>

                                    <th className="px-6 py-4">
                                        Símbolo
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
                                {filteredUnits.map(
                                    (
                                        unit
                                    ) => (
                                        <tr
                                            key={
                                                unit.id
                                            }
                                            className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                        >
                                            <td className="px-6 py-5 font-semibold text-slate-900">
                                                {
                                                    unit.name
                                                }
                                            </td>

                                            <td className="px-6 py-5 text-slate-600">
                                                {unit.symbol ??
                                                    "—"}
                                            </td>

                                            <td className="px-6 py-5">
                                                <ActiveStatusBadge isActive={unit.isActive} />
                                            </td>

                                            {isAdministrator && (
                                                <td className="px-6 py-5">
                                                    <CatalogRowActions
                                                        isActive={unit.isActive}
                                                        isChanging={changingStatusId === unit.id}
                                                        disabled={isSubmitting || changingStatusId !== null}
                                                        onEdit={() => startEditing(unit)}
                                                        onToggleStatus={() => void handleStatusChange(unit)}
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
                    id="unit-form-modal"
                    title={editingUnitId !== null ? "Editar unidad" : "Nueva unidad"}
                    description={editingUnitId !== null
                        ? "Modifica el nombre o símbolo de la unidad seleccionada."
                        : "Registra una unidad que podrá usarse en productos y proveedores."}
                    isSubmitting={isSubmitting}
                    onClose={cancelEditing}
                >
                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6 grid gap-5"
                    >
                        <div>
                            <label
                                htmlFor="unit-name"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Nombre
                            </label>

                            <input
                                id="unit-name"
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
                                }}
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. Pieza, Caja, Par"
                                autoComplete="off"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />

                            {duplicateUnit && (
                                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                                    Ya existe la
                                    unidad "
                                    {
                                        duplicateUnit.name
                                    }
                                    ".
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="unit-symbol"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Símbolo{" "}
                                <span className="text-xs font-normal text-slate-500">
                                    (opcional)
                                </span>
                            </label>

                            <input
                                id="unit-symbol"
                                value={symbol}
                                onChange={(
                                    event
                                ) => {
                                    setSymbol(
                                        event
                                            .target
                                            .value
                                    );

                                    setFormError(
                                        null
                                    );
                                }}
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. pza, cj, par"
                                autoComplete="off"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        {formError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700"
                            >
                                {formError}
                            </div>
                        )}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
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

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    Boolean(
                                        duplicateUnit
                                    )
                                }
                                className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : editingUnitId !==
                                        null
                                        ? "Guardar cambios"
                                        : "Crear unidad"}
                            </button>
                        </div>
                    </form>
                </CatalogFormModal>
            )}
        </div>
    );
};
