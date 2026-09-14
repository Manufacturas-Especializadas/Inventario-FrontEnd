import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    sizesService,
} from "../api/services/sizesService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    useSizes,
} from "../hooks/useSizes";

import type {
    ProductSize,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

import { StatCard } from "../components/ui/StatCard";
import { ActiveStatusBadge } from "../components/ui/ActiveStatusBadge";
import { CatalogStatusFilters } from "../components/catalogs/CatalogStatusFilters";
import { CatalogNameForm } from "../components/catalogs/CatalogNameForm";
import { CatalogRowActions } from "../components/catalogs/CatalogRowActions";

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

export const SizesPage = () => {
    const {
        sizes,
        loading,
        error,
        refresh,
    } = useSizes();

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
        editingSizeId,
        setEditingSizeId,
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
                sizes.filter(
                    (size) =>
                        size.isActive
                ).length;

            return {
                total: sizes.length,
                active,
                inactive:
                    sizes.length -
                    active,
            };
        }, [sizes]);

    const filteredSizes =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(search);

            return sizes
                .filter((size) => {
                    const matchesStatus =
                        statusFilter ===
                        "all" ||
                        (
                            statusFilter ===
                                "active"
                                ? size.isActive
                                : !size.isActive
                        );

                    const matchesSearch =
                        normalizeText(
                            size.name
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
            sizes,
            search,
            statusFilter,
        ]);

    const duplicateSize =
        useMemo(() => {
            const normalizedName =
                normalizeText(name);

            if (!normalizedName) {
                return undefined;
            }

            return sizes.find(
                (size) =>
                    size.id !==
                    editingSizeId &&
                    normalizeText(
                        size.name
                    ) ===
                    normalizedName
            );
        }, [
            sizes,
            name,
            editingSizeId,
        ]);

    const resetForm = () => {
        setName("");
        setEditingSizeId(null);
        setFormError(null);
    };

    const startEditing = (
        size: ProductSize
    ) => {
        setEditingSizeId(
            size.id
        );

        setName(
            size.name
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
                    "El nombre de la talla es obligatorio."
                );

                return;
            }

            if (duplicateSize) {
                setFormError(
                    `Ya existe una talla llamada "${duplicateSize.name}".`
                );

                return;
            }

            setIsSubmitting(true);

            try {
                if (
                    editingSizeId !==
                    null
                ) {
                    const updatedSize =
                        await sizesService
                            .update(
                                editingSizeId,
                                {
                                    name:
                                        trimmedName,
                                }
                            );

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Talla "${updatedSize.name}" actualizada correctamente.`
                    );
                } else {
                    const createdSize =
                        await sizesService
                            .create({
                                name:
                                    trimmedName,
                            });

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Talla "${createdSize.name}" creada correctamente.`
                    );
                }
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        editingSizeId !==
                            null
                            ? "No fue posible actualizar la talla."
                            : "No fue posible crear la talla."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const handleStatusChange =
        async (
            size: ProductSize
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
                size.id
            );

            try {
                const updatedSize =
                    await sizesService
                        .setStatus(
                            size.id,
                            {
                                isActive:
                                    !size.isActive,
                            }
                        );

                await refresh();

                setSuccessMessage(
                    `Talla "${updatedSize.name}" ${updatedSize.isActive
                        ? "activada"
                        : "desactivada"
                    } correctamente.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        size.isActive
                            ? "No fue posible desactivar la talla."
                            : "No fue posible activar la talla."
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
                    Tallas de producto
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Administra las tallas disponibles
                    para los productos de inventario.
                </p>
            </div>

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editingSizeId !== null
                            ? "Editar talla"
                            : "Nueva talla"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {editingSizeId !== null
                            ? "Modifica el nombre de la talla seleccionada."
                            : "Registra una talla que podrá utilizarse en los productos."}
                    </p>

                    {successMessage && (
                        <div
                            role="status"
                            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800"
                        >
                            {successMessage}
                        </div>
                    )}

                    <CatalogNameForm
                        inputId="size-name"
                        name={name}
                        placeholder="Ej. Chica, Mediana, Grande, XL"
                        onNameChange={(event) => {
                            setName(event.target.value);
                            setFormError(null);
                            setSuccessMessage(null);
                        }}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        duplicateMessage={duplicateSize
                            ? `Ya existe la talla "${duplicateSize.name}".`
                            : null}
                        errorMessage={formError}
                        showCancel={editingSizeId !== null}
                        onCancel={cancelEditing}
                        submitDisabled={isSubmitting || Boolean(duplicateSize)}
                        submitLabel={isSubmitting
                            ? "Guardando..."
                            : editingSizeId !== null
                                ? "Guardar cambios"
                                : "Crear talla"}
                    />
                </section>
            )}

            <dl className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                <StatCard
                    label="Total"
                    value={loading
                        ? "…"
                        : summary.total}
                />

                <StatCard
                    label="Activas"
                    value={loading
                        ? "…"
                        : summary.active}
                />

                <StatCard
                    label="Inactivas"
                    value={loading
                        ? "…"
                        : summary.inactive}
                />
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Tallas registradas
                            </h2>

                            {!loading &&
                                !error && (
                                    <p className="mt-1 text-sm text-slate-500">
                                        {
                                            filteredSizes.length
                                        }{" "}
                                        {filteredSizes.length ===
                                            1
                                            ? "resultado"
                                            : "resultados"}
                                    </p>
                                )}
                        </div>
                    </div>

                    <CatalogStatusFilters
                        searchId="size-search"
                        statusId="size-status"
                        search={search}
                        searchPlaceholder="Nombre de la talla"
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
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {loading && (
                    <div className="p-6 text-sm text-slate-500">
                        Cargando tallas...
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
                    sizes.length === 0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay tallas
                            registradas.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    sizes.length > 0 &&
                    filteredSizes.length ===
                    0 && (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No hay tallas que
                            coincidan con los
                            filtros.
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredSizes.length >
                    0 && (
                        <div
                            className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
                            tabIndex={0}
                            role="region"
                            aria-label="Tallas registradas"
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
                                    {filteredSizes.map(
                                        (
                                            size
                                        ) => (
                                            <tr
                                                key={
                                                    size.id
                                                }
                                                className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-6 py-5 font-semibold text-slate-900">
                                                    {
                                                        size.name
                                                    }
                                                </td>

                                                <td className="px-6 py-5">
                                                    <ActiveStatusBadge isActive={size.isActive} />
                                                </td>

                                                {isAdministrator && (
                                                    <td className="px-6 py-5">
                                                        <CatalogRowActions
                                                            isActive={size.isActive}
                                                            isChanging={changingStatusId === size.id}
                                                            disabled={isSubmitting || changingStatusId !== null}
                                                            onEdit={() => startEditing(size)}
                                                            onToggleStatus={() => void handleStatusChange(size)}
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
        </div>
    );
};
