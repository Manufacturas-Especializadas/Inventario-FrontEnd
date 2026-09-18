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
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { PageHeader } from "../components/ui/PageHeader";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";

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
        hasLoaded,
        upsertSize,
    } = useSizes();

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

                    upsertSize(updatedSize);

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

                    upsertSize(createdSize);

                    resetForm();

                    setSuccessMessage(
                        `Talla "${createdSize.name}" creada correctamente.`
                    );
                }
                setIsFormOpen(false);
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

                upsertSize(updatedSize);

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
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Tallas de producto"
                description="Administra las tallas disponibles para los productos de inventario."
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
                        aria-controls="size-form-modal"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none sm:w-auto"
                    >
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Nueva talla
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

            <section id="sizes-list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Tallas registradas</h2>
                            {!loading && hasLoaded && !error && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredSizes.length} {filteredSizes.length === 1 ? "resultado" : "resultados"}
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
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {loading && <CatalogLoadingSkeleton label="Cargando tallas" />}
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

                {!loading && hasLoaded && !error && sizes.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay tallas registradas.
                    </div>
                )}

                {!loading && hasLoaded && !error && sizes.length > 0 && filteredSizes.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No hay tallas que coincidan con los filtros.
                    </div>
                )}

                {!loading && hasLoaded && !error && filteredSizes.length > 0 && (
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

            {isAdministrator && isFormOpen && (
                <CatalogFormModal
                    id="size-form-modal"
                    title={editingSizeId !== null ? "Editar talla" : "Nueva talla"}
                    description={editingSizeId !== null
                        ? "Modifica el nombre de la talla seleccionada."
                        : "Registra una talla que podrá utilizarse en los productos."}
                    isSubmitting={isSubmitting}
                    onClose={cancelEditing}
                >
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
                        showCancel={true}
                        onCancel={cancelEditing}
                        submitDisabled={isSubmitting || Boolean(duplicateSize)}
                        submitLabel={isSubmitting
                            ? "Guardando..."
                            : editingSizeId !== null
                                ? "Guardar cambios"
                                : "Crear talla"}
                    />
                </CatalogFormModal>
            )}
        </div>
    );
};
