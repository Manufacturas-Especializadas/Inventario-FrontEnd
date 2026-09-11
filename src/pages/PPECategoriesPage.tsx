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

type StatusFilter = "all" | "active" | "inactive";

const normalizeCategoryText = (value: string) =>
    value.trim().toLocaleLowerCase("es");

export const PPECategoriesPage = () => {

    const {
        categories,

        loading,
        updatingId,
        changingStatusId,

        error,
        actionError,

        refresh,
        updateCategory,
        setCategoryStatus,
        clearError,
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
    const missingName = Boolean(formError && !name.trim());

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
    };


    const cancelEditing = () => {
        clearError();

        setEditingCategoryId(null);

        setEditName("");
        setEditDescription("");

        setEditError(null);
    };


    const saveCategoryEdit =
        async (
            categoryId: number
        ) => {
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

            setEditingCategoryId(
                null
            );

            setEditName("");
            setEditDescription("");

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

                setName("");

                setDescription("");
                clearFilters();

                await refresh();

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
            <div className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        MESA · Catálogos
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Categorías de inventario
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                        Organiza tus artículos por categoría y mantén una clasificación clara de los recursos de MESA.
                    </p>
                </div>
            </div>

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><path d="M17.5 14v7M14 17.5h7" /></svg>
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Nueva categoría
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">Define un nombre y una descripción para agrupar tus artículos.</p>
                        </div>
                    </div>

                    {successMessage && !formError && (
                        <div role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800">
                            <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />
                            </svg>
                            <span className="min-w-0 wrap-anywhere">{successMessage}</span>
                        </div>
                    )}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-7 grid gap-6 lg:grid-cols-2 [&>div]:min-w-0"
                    >
                        <div>
                            <label
                                htmlFor="category-name"
                                className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700"
                            >
                                Nombre
                                <span aria-hidden="true" className="shrink-0 text-xs font-normal tabular-nums text-slate-500">{name.length}/100</span>
                            </label>

                            <input
                                id="category-name"
                                maxLength={100}
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="off"
                                aria-required="true"
                                aria-invalid={Boolean(duplicateCategory) || missingName}
                                aria-describedby={duplicateCategory
                                    ? "category-duplicate-warning"
                                    : missingName ? "category-form-error" : undefined}
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Ej. Herramientas, consumibles o refacciones"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />
                            {duplicateCategory && (
                                <p id="category-duplicate-warning" role="status" className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm leading-6 text-amber-800">
                                    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m12 3 10 18H2L12 3ZM12 9v4m0 4h.01" />
                                    </svg>
                                    <span className="min-w-0 wrap-break-word">Ya existe una categoría llamada "{duplicateCategory.name}".</span>
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="category-description"
                                className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700"
                            >
                                <span>Descripción <span className="ml-1 text-xs font-normal text-slate-500">(opcional)</span></span>
                                <span aria-hidden="true" className="shrink-0 text-xs font-normal tabular-nums text-slate-500">{description.length}/250</span>
                            </label>

                            <input
                                id="category-description"
                                maxLength={250}
                                value={
                                    description
                                }
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    setFormError(null);
                                    setSuccessMessage(null);
                                }}
                                autoComplete="off"
                                disabled={
                                    isSubmitting
                                }
                                placeholder="Describe qué artículos incluye esta categoría"
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition duration-200 placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                            />
                        </div>

                        {formError && (
                            <div id="category-form-error" role="alert" className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-700 lg:col-span-2">
                                {formError}
                            </div>
                        )}

                        <div className="flex justify-end border-t border-slate-100 pt-5 lg:col-span-2">
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting || loading || Boolean(duplicateCategory)
                                }
                                className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                            >
                                {isSubmitting
                                    ? "Guardando..."
                                    : "Crear categoría"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <dl aria-label="Resumen de categorías" aria-busy={loading} className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800">
                {[
                    { label: "Total de categorías", value: summary.total },
                    { label: "Categorías activas", value: summary.active },
                    { label: "Categorías inactivas", value: summary.inactive },
                ].map((item) => (
                    <div key={item.label} className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                        <dt className="text-sm font-medium text-slate-600">{item.label}</dt>
                        <dd className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                            {loading ? "…" : error ? "—" : item.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Categorías registradas
                        </h2>
                        {!loading && !error && (
                            <p role="status" aria-atomic="true" className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tabular-nums text-sky-800 ring-1 ring-inset ring-sky-200">
                                {filteredCategories.length} {filteredCategories.length === 1 ? "resultado" : "resultados"}
                            </p>
                        )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">Consulta la clasificación y el estado de cada categoría.</p>

                    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-end sm:p-5">
                        <div className="min-w-0 flex-1">
                            <label htmlFor="category-search" className="block text-sm font-medium text-slate-700">Buscar categorías</label>
                            <input
                                id="category-search"
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setSuccessMessage(null);
                                }}
                                placeholder="Buscar por nombre o descripción"
                                autoComplete="off"
                                className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>
                        <div className="min-w-0 sm:w-44">
                            <label htmlFor="category-status" className="block text-sm font-medium text-slate-700">Estado</label>
                            <select
                                id="category-status"
                                value={statusFilter}
                                onChange={(event) => {
                                    setStatusFilter(event.target.value as StatusFilter);
                                    setSuccessMessage(null);
                                }}
                                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            >
                                <option value="all">Todas</option>
                                <option value="active">Activas</option>
                                <option value="inactive">Inactivas</option>
                            </select>
                        </div>
                        {hasFilters && (
                            <button type="button" onClick={clearFilters} className="min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none">
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <div role="status" className="m-6 flex flex-col items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-6 py-10 text-center text-sm text-sky-800 sm:mx-8">
                        <span aria-hidden="true" className="h-7 w-7 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700 motion-reduce:animate-none" />
                        Cargando categorías...
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-5 py-4 text-sm leading-6 text-red-700 sm:mx-8">
                        {successMessage && <p className="mb-1 font-semibold">La categoría se creó, pero no se pudo actualizar el listado.</p>}
                        {error}
                    </div>
                )}

                {!loading &&
                    !error &&
                    categories.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M3 10h18" /></svg>
                            <p className="text-sm font-semibold text-slate-900">Aún no hay categorías registradas</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Las categorías aparecerán aquí cuando se agreguen al catálogo.</p>
                        </div>
                    )}

                {catalogMessage &&
                    !actionError && (
                        <div
                            role="status"
                            className="m-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-800 sm:mx-8"
                        >
                            <svg aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" />
                            </svg>
                            <span className="min-w-0 wrap-anywhere">{catalogMessage}</span>
                        </div>
                    )}

                {actionError && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm leading-6 text-red-700 sm:mx-8"
                    >
                        {actionError}
                    </div>
                )}

                {!loading &&
                    !error &&
                    categories.length > 0 &&
                    filteredCategories.length === 0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                            <svg aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="10.5" cy="10.5" r="6.5" />
                                <path d="m16 16 4 4" />
                            </svg>
                            <p className="text-sm font-semibold text-slate-900">No encontramos coincidencias.</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Prueba con otro término o elimina los filtros.</p>
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredCategories.length > 0 && (
                        <div className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200" tabIndex={0} role="region" aria-label="Categorías registradas">
                            <p className="sticky left-0 w-fit px-6 py-3 text-xs leading-5 text-slate-500 lg:hidden">Desliza horizontalmente para ver todas las columnas.</p>
                            <table className="w-full min-w-200 text-left text-sm">
                                <thead className="border-b border-sky-100 bg-sky-50/80 text-xs uppercase tracking-wider text-sky-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 sm:px-8">
                                            Nombre
                                        </th>

                                        <th scope="col" className="px-6 py-4 sm:px-8">
                                            Descripción
                                        </th>

                                        <th scope="col" className="px-6 py-4 sm:px-8">
                                            Estado
                                        </th>
                                        {isAdministrator && (
                                            <th
                                                scope="col"
                                                className="px-6 py-4 text-right sm:px-8"
                                            >
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
                                                className={`transition-colors duration-150 motion-reduce:transition-none ${editingCategoryId === category.id ? "bg-sky-50/80 shadow-[inset_3px_0_0_0_#0284c7] [&>td]:align-top" : "hover:bg-sky-50/50 focus-within:bg-sky-50/50"}`}
                                                key={category.id}
                                            >
                                                <td className="min-w-52 max-w-xs wrap-anywhere px-6 py-5 sm:px-8">
                                                    {editingCategoryId ===
                                                        category.id ? (
                                                        <div>
                                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                                <label htmlFor="category-edit-name" className="text-xs font-semibold text-slate-700">Nombre</label>
                                                                <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800">Editando</span>
                                                            </div>
                                                            <input
                                                                id="category-edit-name"
                                                                aria-label="Nombre de la categoría en edición"
                                                                aria-describedby="category-edit-feedback"
                                                                aria-invalid={Boolean(editDuplicateCategory)}
                                                                value={editName}
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    setEditName(
                                                                        event.target
                                                                            .value
                                                                    );

                                                                    setEditError(
                                                                        null
                                                                    );

                                                                    clearError();
                                                                }}
                                                                maxLength={100}
                                                                disabled={
                                                                    updatingId ===
                                                                    category.id
                                                                }
                                                                className="min-h-11 w-full rounded-xl border border-sky-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-400 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                                            />

                                                            <div id="category-edit-feedback">
                                                                {editDuplicateCategory && (
                                                                    <p role="status" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
                                                                        Ya existe una categoría llamada "
                                                                        {
                                                                            editDuplicateCategory.name
                                                                        }
                                                                        ".
                                                                    </p>
                                                                )}

                                                                {editError && (
                                                                    <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                                                                        {editError}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="font-semibold text-slate-900">
                                                            {category.name}
                                                        </span>
                                                    )}
                                                </td>


                                                <td className="min-w-64 max-w-md wrap-anywhere px-6 py-5 leading-6 text-slate-600 sm:px-8">
                                                    {editingCategoryId ===
                                                        category.id ? (
                                                        <div>
                                                            <label htmlFor="category-edit-description" className="mb-3 block py-1 text-xs font-semibold leading-4 text-slate-700">Descripción <span className="font-normal text-slate-500">(opcional)</span></label>
                                                            <input
                                                                id="category-edit-description"
                                                                value={
                                                                    editDescription
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) => {
                                                                    setEditDescription(
                                                                        event.target
                                                                            .value
                                                                    );

                                                                    setEditError(
                                                                        null
                                                                    );

                                                                    clearError();
                                                                }}
                                                                maxLength={250}
                                                                disabled={
                                                                    updatingId ===
                                                                    category.id
                                                                }
                                                                className="min-h-11 w-full rounded-xl border border-sky-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-400 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                                            />
                                                        </div>
                                                    ) : (
                                                        category.description ??
                                                        "—"
                                                    )}
                                                </td>


                                                <td className="px-6 py-5 sm:px-8">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${category.isActive
                                                                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                                : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className="h-1.5 w-1.5 rounded-full bg-current"
                                                        />

                                                        {category.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>


                                                {isAdministrator && (
                                                    <td className="px-6 py-5 sm:px-8">
                                                        {editingCategoryId ===
                                                            category.id ? (
                                                            <div className="ml-auto grid w-40 grid-cols-1 gap-2 pt-9 sm:w-72 sm:grid-cols-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void saveCategoryEdit(
                                                                            category.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        updatingId ===
                                                                        category.id ||
                                                                        !editName.trim() ||
                                                                        Boolean(
                                                                            editDuplicateCategory
                                                                        )
                                                                    }
                                                                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-sky-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                                >
                                                                    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                                                                    {updatingId ===
                                                                        category.id
                                                                        ? "Guardando..."
                                                                        : "Guardar"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={
                                                                        cancelEditing
                                                                    }
                                                                    disabled={
                                                                        updatingId ===
                                                                        category.id
                                                                    }
                                                                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                                >
                                                                    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12M6 18 18 6" /></svg>
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="ml-auto grid w-40 grid-cols-1 gap-2 sm:w-72 sm:grid-cols-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        startEditing(
                                                                            category
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        changingStatusId ===
                                                                        category.id
                                                                    }
                                                                    className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                                                >
                                                                    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z" /></svg>
                                                                    Editar
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        void changeCategoryStatus(
                                                                            category
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        changingStatusId ===
                                                                        category.id
                                                                    }
                                                                    className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${category.isActive ? "border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:border-amber-300 enabled:hover:bg-amber-100 focus-visible:ring-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus-visible:ring-emerald-100"}`}
                                                                >
                                                                    {changingStatusId ===
                                                                        category.id
                                                                        ? "Procesando..."
                                                                        : category.isActive
                                                                            ? "Desactivar"
                                                                            : "Activar"}
                                                                </button>
                                                            </div>
                                                        )}
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
