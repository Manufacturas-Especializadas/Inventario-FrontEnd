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
    } = useUnits();

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

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const cancelEditing = () => {
        resetForm();
        setSuccessMessage(null);
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

                    await refresh();

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

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Unidad "${createdUnit.name}" creada correctamente.`
                    );
                }
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

                await refresh();

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
            <div className="rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Catálogos
                </p>

                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Unidades de medida
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Administra las unidades utilizadas
                    para controlar inventario y las
                    presentaciones de compra de los
                    productos.
                </p>
            </div>

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editingUnitId !== null
                            ? "Editar unidad"
                            : "Nueva unidad"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {editingUnitId !== null
                            ? "Modifica el nombre o símbolo de la unidad seleccionada."
                            : "Registra una unidad que podrá usarse en productos y proveedores."}
                    </p>

                    {successMessage && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            {successMessage}
                        </div>
                    )}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6 grid gap-5 md:grid-cols-2"
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
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                            />

                            {duplicateUnit && (
                                <p className="mt-2 text-sm text-amber-700">
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
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                            />
                        </div>

                        {formError && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2"
                            >
                                {formError}
                            </div>
                        )}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 md:col-span-2">
                            {editingUnitId !==
                                null && (
                                    <button
                                        type="button"
                                        onClick={
                                            cancelEditing
                                        }
                                        disabled={
                                            isSubmitting
                                        }
                                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                                    >
                                        Cancelar
                                    </button>
                                )}

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    Boolean(
                                        duplicateUnit
                                    )
                                }
                                className="rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
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
                </section>
            )}

            <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
                    <dt className="text-sm text-slate-600">
                        Total
                    </dt>

                    <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {loading
                            ? "…"
                            : summary.total}
                    </dd>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
                    <dt className="text-sm text-slate-600">
                        Activas
                    </dt>

                    <dd className="mt-2 text-2xl font-semibold text-slate-900">
                        {loading
                            ? "…"
                            : summary.active}
                    </dd>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
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

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Unidades registradas
                            </h2>

                            {!loading &&
                                !error && (
                                    <p className="mt-1 text-sm text-slate-500">
                                        {
                                            filteredUnits.length
                                        }{" "}
                                        {filteredUnits.length ===
                                            1
                                            ? "resultado"
                                            : "resultados"}
                                    </p>
                                )}
                        </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                            <label
                                htmlFor="unit-search"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Buscar
                            </label>

                            <input
                                id="unit-search"
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
                                placeholder="Nombre o símbolo"
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
                            />
                        </div>

                        <div className="sm:w-48">
                            <label
                                htmlFor="unit-status"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Estado
                            </label>

                            <select
                                id="unit-status"
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
                                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
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
                                    className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
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
                        className="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando unidades...
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
                    units.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay unidades
                            registradas.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    units.length > 0 &&
                    filteredUnits.length ===
                    0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay unidades que
                            coincidan con los
                            filtros.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredUnits.length >
                    0 && (
                        <div className="overflow-x-auto">
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
                                                className="hover:bg-sky-50/50"
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
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${unit.isActive
                                                                ? "bg-emerald-50 text-emerald-800"
                                                                : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {unit.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>

                                                {isAdministrator && (
                                                    <td className="px-6 py-5">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    startEditing(
                                                                        unit
                                                                    )
                                                                }
                                                                disabled={
                                                                    isSubmitting ||
                                                                    changingStatusId !==
                                                                    null
                                                                }
                                                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleStatusChange(
                                                                        unit
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingStatusId !==
                                                                    null ||
                                                                    isSubmitting
                                                                }
                                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${unit.isActive
                                                                        ? "border-red-200 text-red-700"
                                                                        : "border-emerald-200 text-emerald-700"
                                                                    }`}
                                                            >
                                                                {changingStatusId ===
                                                                    unit.id
                                                                    ? "Guardando..."
                                                                    : unit.isActive
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