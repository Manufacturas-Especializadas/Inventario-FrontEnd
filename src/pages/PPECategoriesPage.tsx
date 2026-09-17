import {
    useMemo,
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
import type {
    PPECategory,
} from "../types/types";

import { StatCard } from "../components/ui/StatCard";
import { ActiveStatusBadge } from "../components/ui/ActiveStatusBadge";
import { PageHeader } from "../components/ui/PageHeader";
import { CatalogStatusFilters } from "../components/catalogs/CatalogStatusFilters";
import { CatalogRowActions } from "../components/catalogs/CatalogRowActions";
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";

type StatusFilter = "all" | "active" | "inactive";

const normalizeCategoryText = (value: string) =>
    value.trim().toLocaleLowerCase("es");

export const PPECategoriesPage = () => {

    const {
        categories,

        loading,
        hasLoaded,
        updatingId,
        changingStatusId,

        error,
        actionError,

        refresh,
        upsertCategory,
        updateCategory,
        setCategoryStatus,
        clearError,
    } = usePPECategories({ autoLoad: true });

    const [isFormOpen, setIsFormOpen] = useState(false);


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

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [
        editingCategoryId,
        setEditingCategoryId,
    ] = useState<number | null>(
        null
    );

    const [
        editName,
        setEditName,
    ] = useState("");

    const [
        editDescription,
        setEditDescription,
    ] = useState("");

    const [
        editError,
        setEditError,
    ] = useState<string | null>(
        null
    );

    const [
        catalogMessage,
        setCatalogMessage,
    ] = useState<string | null>(
        null
    );

    const summary = useMemo(() => {
        const active = categories.filter((category) => category.isActive).length;

        return {
            total: categories.length,
            active,
            inactive: categories.length - active,
        };
    }, [categories]);

    const filteredCategories = useMemo(() => {
        const normalizedSearch = normalizeCategoryText(search);

        return categories
            .filter((category) => {
                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === "active" ? category.isActive : !category.isActive);
                const matchesSearch = normalizeCategoryText(category.name).includes(normalizedSearch) ||
                    normalizeCategoryText(category.description ?? "").includes(normalizedSearch);

                return matchesStatus && matchesSearch;
            })
            .sort((first, second) =>
                Number(second.isActive) - Number(first.isActive) ||
                first.name.localeCompare(second.name, "es", { sensitivity: "base" })
            );
    }, [categories, search, statusFilter]);

    const duplicateCategory = useMemo(() => {
        const normalizedName = normalizeCategoryText(name);

        return normalizedName
            ? categories.find((category) => normalizeCategoryText(category.name) === normalizedName)
            : undefined;
    }, [categories, name]);

    const editDuplicateCategory =
        useMemo(() => {
            if (
                editingCategoryId ===
                null
            ) {
                return undefined;
            }

            const normalizedName =
                normalizeCategoryText(
                    editName
                );

            if (!normalizedName) {
                return undefined;
            }

            return categories.find(
                (category) =>
                    category.id !==
                    editingCategoryId &&
                    normalizeCategoryText(
                        category.name
                    ) ===
                    normalizedName
            );
        }, [
            categories,
            editingCategoryId,
            editName,
        ]);

    const hasFilters = search.length > 0 || statusFilter !== "all";
    const isEditing = editingCategoryId !== null;
    const isSaving = isSubmitting || updatingId !== null;
    const currentName = isEditing ? editName : name;
    const currentDescription = isEditing ? editDescription : description;
    const currentDuplicate = isEditing ? editDuplicateCategory : duplicateCategory;
    const currentFormError = isEditing ? editError || actionError : formError;
    const missingName = Boolean(currentFormError && !currentName.trim());

    const resetForm = () => {
        setName("");
        setDescription("");
        setFormError(null);
        setEditingCategoryId(null);
        setEditName("");
        setEditDescription("");
        setEditError(null);
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setSuccessMessage(null);
    };

    const startEditing = (
        category: PPECategory
    ) => {
        clearError();

        setCatalogMessage(null);
        setEditError(null);

        setEditingCategoryId(
            category.id
        );

        setEditName(
            category.name
        );

        setEditDescription(
            category.description ?? ""
        );
        setSuccessMessage(null);
        setIsFormOpen(true);
    };


    const cancelEditing = () => {
        if (isSaving) return;
        clearError();
        resetForm();
        setSuccessMessage(null);
        setIsFormOpen(false);
    };


    const saveCategoryEdit =
        async (
            categoryId: number
        ) => {
            if (!isAdministrator || isSaving) return;
            clearError();

            setCatalogMessage(null);
            setEditError(null);

            const trimmedName =
                editName.trim();

            if (!trimmedName) {
                setEditError(
                    "El nombre de la categoría es obligatorio."
                );

                return;
            }

            if (
                editDuplicateCategory
            ) {
                setEditError(
                    `Ya existe una categoría llamada "${editDuplicateCategory.name}".`
                );

                return;
            }

            const updated =
                await updateCategory(
                    categoryId,
                    {
                        name:
                            trimmedName,

                        description:
                            editDescription
                                .trim() ||
                            null,
                    }
                );

            if (!updated) {
                return;
            }

            resetForm();
            setIsFormOpen(false);

            setCatalogMessage(
                `Categoría "${updated.name}" actualizada correctamente.`
            );
        };

    const changeCategoryStatus =
        async (
            category: PPECategory
        ) => {
            clearError();

            setCatalogMessage(null);

            const updated =
                await setCategoryStatus(
                    category.id,
                    {
                        isActive:
                            !category.isActive,
                    }
                );

            if (!updated) {
                return;
            }

            /*
             * Si estamos editando precisamente
             * esa categoría, cerramos la edición.
             */
            if (
                editingCategoryId ===
                category.id
            ) {
                cancelEditing();
            }

            setCatalogMessage(
                updated.isActive
                    ? `Categoría "${updated.name}" activada correctamente.`
                    : `Categoría "${updated.name}" desactivada correctamente.`
            );
        };

    const handleSubmit =
        async (
            event: FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            if (editingCategoryId !== null) {
                await saveCategoryEdit(editingCategoryId);
                return;
            }

            if (!isAdministrator || isSubmitting || loading) {
                return;
            }

            setFormError(null);
            setSuccessMessage(null);

            const trimmedName =
                name.trim();

            if (!trimmedName) {
                setFormError(
                    "El nombre de la categoría es obligatorio."
                );

                return;
            }

            if (duplicateCategory) {
                return;
            }

            setIsSubmitting(true);

            try {
                const createdCategory = await ppeCategoriesService
                    .create({
                        name:
                            trimmedName,

                        description:
                            description.trim() ||
                            null,
                    });

                upsertCategory(createdCategory);
                resetForm();
                clearFilters();
                setIsFormOpen(false);

                setSuccessMessage(`Categoría "${createdCategory.name}" creada correctamente.`);
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
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader
                eyebrow="MESA · Catálogos"
                title="Categorías de inventario"
                description="Organiza tus artículos por categoría y mantén una clasificación clara de los recursos de MESA."
            />

            {isAdministrator && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setCatalogMessage(null);
                            clearError();
                            setSuccessMessage(null);
                            setIsFormOpen(true);
                        }}
                        aria-haspopup="dialog"
                        aria-controls="category-form-modal"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none sm:w-auto"
                    >
                        Nueva categoría
                    </button>
                </div>
            )}

            {successMessage && !formError && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                    {successMessage}
                </div>
            )}

            {catalogMessage && !actionError && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                    {catalogMessage}
                </div>
            )}

            <dl aria-label="Resumen de categorías" className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                <StatCard label="Total" value={loading ? "…" : error || !hasLoaded ? "—" : summary.total} />
                <StatCard label="Activos" value={loading ? "…" : error || !hasLoaded ? "—" : summary.active} />
                <StatCard label="Inactivos" value={loading ? "…" : error || !hasLoaded ? "—" : summary.inactive} />
            </dl>

            <section id="categories-list" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Categorías registradas</h2>
                            {!loading && hasLoaded && !error && (
                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredCategories.length} {filteredCategories.length === 1 ? "resultado" : "resultados"}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => void refresh()}
                            disabled={loading}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                        >
                            Actualizar
                        </button>
                    </div>

                    <CatalogStatusFilters
                        searchId="category-search"
                        statusId="category-status"
                        search={search}
                        searchPlaceholder="Buscar por nombre o descripción"
                        status={statusFilter}
                        onSearchChange={(event) => {
                            setSearch(event.target.value);
                            setSuccessMessage(null);
                        }}
                        onStatusChange={(event) => {
                            setStatusFilter(event.target.value as StatusFilter);
                            setSuccessMessage(null);
                        }}
                        showClear={hasFilters}
                        onClear={clearFilters}
                    />
                </div>

                {actionError && !isFormOpen && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {loading && <CatalogLoadingSkeleton label="Cargando categorías" />}
                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm leading-6 text-red-700 sm:mx-8">
                        <p className="font-semibold">No fue posible cargar las categorías.</p>
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

                {!loading && hasLoaded && !error && categories.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        Aún no hay categorías registradas
                        <p className="mt-2">Las categorías aparecerán aquí cuando se agreguen al catálogo.</p>
                    </div>
                )}

                {!loading && hasLoaded && !error && categories.length > 0 && filteredCategories.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-500">
                        No encontramos coincidencias.
                        <p className="mt-2">Prueba con otro término o elimina los filtros.</p>
                    </div>
                )}

                {!loading && hasLoaded && !error && filteredCategories.length > 0 && (
                    <div
                        className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
                        tabIndex={0}
                        role="region"
                        aria-label="Categorías registradas"
                    >
                        <p className="sticky left-0 w-fit px-6 py-3 text-xs leading-5 text-slate-500 lg:hidden">Desliza horizontalmente para ver todas las columnas.</p>
                        <table className="w-full min-w-200 text-left text-sm">
                            <thead className="bg-sky-50/80 text-xs uppercase text-sky-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4">
                                        Nombre
                                    </th>

                                    <th scope="col" className="px-6 py-4">Descripción</th>

                                    <th scope="col" className="px-6 py-4">
                                        Estado
                                    </th>

                                    {isAdministrator && (
                                        <th scope="col" className="px-6 py-4 text-right">
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredCategories.map(
                                    (
                                        category
                                    ) => (
                                        <tr
                                            key={
                                                category.id
                                            }
                                            className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                        >
                                            <td className="min-w-52 max-w-xs wrap-anywhere px-6 py-5 font-semibold text-slate-900">
                                                {
                                                    category.name
                                                }
                                            </td>

                                            <td className="min-w-64 max-w-md wrap-anywhere px-6 py-5 leading-6 text-slate-600">
                                                {category.description ?? "—"}
                                            </td>

                                            <td className="px-6 py-5">
                                                <ActiveStatusBadge isActive={category.isActive} />
                                            </td>

                                            {isAdministrator && (
                                                <td className="px-6 py-5">
                                                    <CatalogRowActions
                                                        isActive={category.isActive}
                                                        isChanging={changingStatusId === category.id}
                                                        changingLabel="Procesando..."
                                                        disabled={isSaving || changingStatusId === category.id}
                                                        onEdit={() => startEditing(category)}
                                                        onToggleStatus={() => void changeCategoryStatus(category)}
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
                    id="category-form-modal"
                    title={editingCategoryId !== null ? "Editar categoría" : "Nueva categoría"}
                    description={editingCategoryId !== null
                        ? "Modifica el nombre y la descripción de la categoría seleccionada."
                        : "Define un nombre y una descripción para agrupar tus artículos."}
                    isSubmitting={isSaving}
                    onClose={cancelEditing}
                >
                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6 space-y-6"
                    >
                        <div>
                            <label
                                htmlFor={isEditing ? "category-edit-name" : "category-name"}
                                className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700"
                            >
                                Nombre
                                <span aria-hidden="true" className="shrink-0 text-xs font-normal tabular-nums text-slate-500">{currentName.length}/100</span>
                            </label>

                            <input
                                id={isEditing ? "category-edit-name" : "category-name"}
                                maxLength={100}
                                value={currentName}
                                onChange={(event) => {
                                    if (isEditing) setEditName(event.target.value);
                                    else setName(event.target.value);
                                    setEditError(null);
                                    if (isEditing) clearError();
                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="off"
                                aria-required="true"
                                aria-invalid={Boolean(currentDuplicate) || missingName}
                                aria-describedby={currentDuplicate
                                    ? "category-duplicate-warning"
                                    : missingName ? "category-form-error" : undefined}
                                disabled={
                                    isSaving
                                }
                                placeholder="Ej. Herramientas, consumibles o refacciones"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />
                            {currentDuplicate && (
                                <p id="category-duplicate-warning" role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm leading-6 text-amber-800">
                                    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m12 3 10 18H2L12 3ZM12 9v4m0 4h.01" />
                                    </svg>
                                    <span className="min-w-0 wrap-break-word">Ya existe una categoría llamada "{currentDuplicate.name}".</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor={isEditing ? "category-edit-description" : "category-description"}
                                className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700"
                            >
                                <span>Descripción <span className="ml-1 text-xs font-normal text-slate-500">(opcional)</span></span>
                                <span aria-hidden="true" className="shrink-0 text-xs font-normal tabular-nums text-slate-500">{currentDescription.length}/250</span>
                            </label>

                            <input
                                id={isEditing ? "category-edit-description" : "category-description"}
                                maxLength={250}
                                value={
                                    currentDescription
                                }
                                onChange={(event) => {
                                    if (isEditing) setEditDescription(event.target.value);
                                    else setDescription(event.target.value);
                                    setEditError(null);
                                    if (isEditing) clearError();
                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="off"
                                disabled={
                                    isSaving
                                }
                                placeholder="Describe qué artículos incluye esta categoría"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        {currentFormError && (
                            <div id="category-form-error" role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-700">
                                {currentFormError}
                            </div>
                        )}

                        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                            <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={isSaving}
                                className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isSaving || (!isEditing && loading) || (isEditing && !editName.trim()) || Boolean(currentDuplicate)
                                }
                                className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {isSaving
                                    ? "Guardando..."
                                    : isEditing ? "Guardar" : "Crear categoría"}
                            </button>
                        </div>
                    </form>
                </CatalogFormModal>
            )}
        </div>
    );
};
