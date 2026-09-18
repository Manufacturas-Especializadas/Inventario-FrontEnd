import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    suppliersService,
} from "../api/services/SuppliersService";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    useSuppliers,
} from "../hooks/useSuppliers";

import { useSupplierProducts } from "../hooks/useSupplierProducts";

import type {
    Supplier,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

import {
    validateSupplierContact,
    type SupplierContactErrors,
} from "../utils/supplierValidation";


import { SupplierProductsModal } from "../components/suppliers/SupplierProductsModal";

import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { ActiveStatusBadge } from "../components/ui/ActiveStatusBadge";
import { CatalogRowActions } from "../components/catalogs/CatalogRowActions";
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { CatalogLoadingSkeleton } from "../components/catalogs/CatalogLoadingSkeleton";

type StatusFilter =
    | "all"
    | "active"
    | "inactive";

const normalizeText = (
    value: string | null
) =>
    (value ?? "")
        .trim()
        .toLocaleLowerCase("es");

export const SuppliersPage = () => {
    const {
        suppliers,
        hasLoaded,
        upsertSupplier,
        loading,
        error,
        refresh,
    } = useSuppliers();

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
        contactName,
        setContactName,
    ] = useState("");

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        phone,
        setPhone,
    ] = useState("");

    const [
        editingSupplierId,
        setEditingSupplierId,
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

    const [contactErrors, setContactErrors] = useState<SupplierContactErrors>({});

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

    const [
        selectedProductsSupplier,
        setSelectedProductsSupplier,
    ] = useState<Supplier | null>(
        null
    );

    const {
        supplierProducts,
        loadingSupplierProducts,
        supplierProductsError,
        hasLoadedSupplierProducts,
        loadSupplierProducts,
        refreshSupplierProducts,
        upsertRelation,
    } = useSupplierProducts(
        selectedProductsSupplier?.id ??
        null
    );

    const openSupplierProducts =
        (
            supplier: Supplier
        ) => {
            setSelectedProductsSupplier(
                supplier
            );

            void loadSupplierProducts(
                supplier.id
            );
        };

    const summary =
        useMemo(() => {
            const active =
                suppliers.filter(
                    (supplier) =>
                        supplier.isActive
                ).length;

            return {
                total:
                    suppliers.length,

                active,

                inactive:
                    suppliers.length -
                    active,
            };
        }, [suppliers]);

    const filteredSuppliers =
        useMemo(() => {
            const normalizedSearch =
                normalizeText(search);

            return suppliers
                .filter((supplier) => {
                    const matchesStatus =
                        statusFilter ===
                        "all" ||
                        (
                            statusFilter ===
                                "active"
                                ? supplier.isActive
                                : !supplier.isActive
                        );

                    const matchesSearch =
                        [
                            supplier.name,
                            supplier.contactName,
                            supplier.email,
                            supplier.phone,
                        ].some(
                            (value) =>
                                normalizeText(
                                    value
                                ).includes(
                                    normalizedSearch
                                )
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
            suppliers,
            search,
            statusFilter,
        ]);

    const duplicateSupplier =
        useMemo(() => {
            const normalizedName =
                normalizeText(name);

            if (!normalizedName) {
                return undefined;
            }

            return suppliers.find(
                (supplier) =>
                    supplier.id !==
                    editingSupplierId &&
                    normalizeText(
                        supplier.name
                    ) ===
                    normalizedName
            );
        }, [
            suppliers,
            name,
            editingSupplierId,
        ]);

    const resetForm = () => {
        setName("");
        setContactName("");
        setEmail("");
        setPhone("");
        setEditingSupplierId(null);
        setFormError(null);
        setContactErrors({});
    };

    const startEditing = (
        supplier: Supplier
    ) => {
        setEditingSupplierId(
            supplier.id
        );

        setName(
            supplier.name
        );

        setContactName(
            supplier.contactName ?? ""
        );

        setEmail(
            supplier.email ?? ""
        );

        setPhone(
            (supplier.phone ?? "").replace(/[^0-9]/g, "")
        );

        setContactErrors({});
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

    const hasSupplierData = hasLoaded || suppliers.length > 0;

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
                    "El nombre del proveedor es obligatorio."
                );

                return;
            }

            if (duplicateSupplier) {
                setFormError(
                    `Ya existe un proveedor llamado "${duplicateSupplier.name}".`
                );

                return;
            }

            const errors = validateSupplierContact(email, phone);
            setContactErrors(errors);

            if (errors.email || errors.phone) {
                const fieldId = errors.email ? "supplier-email" : "supplier-phone";
                event.currentTarget.querySelector<HTMLInputElement>(`#${fieldId}`)?.focus();
                return;
            }

            setIsSubmitting(true);

            try {
                const request = {
                    name:
                        trimmedName,

                    contactName:
                        contactName.trim() ||
                        null,

                    email:
                        email.trim() ||
                        null,

                    phone:
                        phone.trim() ||
                        null,
                };

                if (
                    editingSupplierId !==
                    null
                ) {
                    const updatedSupplier =
                        await suppliersService
                            .update(
                                editingSupplierId,
                                request
                            );

                    upsertSupplier(updatedSupplier);

                    resetForm();

                    setSuccessMessage(
                        `Proveedor "${updatedSupplier.name}" actualizado correctamente.`
                    );
                } else {
                    const createdSupplier =
                        await suppliersService
                            .create(
                                request
                            );

                    upsertSupplier(createdSupplier);

                    resetForm();

                    setSuccessMessage(
                        `Proveedor "${createdSupplier.name}" creado correctamente.`
                    );
                }
                setIsFormOpen(false);
            } catch (error) {
                setFormError(
                    getApiErrorMessage(
                        error,
                        editingSupplierId !==
                            null
                            ? "No fue posible actualizar el proveedor."
                            : "No fue posible crear el proveedor."
                    )
                );
            } finally {
                setIsSubmitting(false);
            }
        };

    const handleStatusChange =
        async (
            supplier: Supplier
        ) => {
            if (
                !isAdministrator ||
                changingStatusId !==
                null ||
                isSubmitting
            ) {
                return;
            }

            setActionError(null);
            setSuccessMessage(null);

            setChangingStatusId(
                supplier.id
            );

            try {
                const updatedSupplier =
                    await suppliersService
                        .setStatus(
                            supplier.id,
                            {
                                isActive:
                                    !supplier.isActive,
                            }
                        );

                upsertSupplier(updatedSupplier);

                if (
                    editingSupplierId ===
                    supplier.id &&
                    !updatedSupplier.isActive
                ) {
                    resetForm();
                    setIsFormOpen(false);
                }

                setSuccessMessage(
                    `Proveedor "${updatedSupplier.name}" ${updatedSupplier.isActive
                        ? "activado"
                        : "desactivado"
                    } correctamente.`
                );
            } catch (error) {
                setActionError(
                    getApiErrorMessage(
                        error,
                        supplier.isActive
                            ? "No fue posible desactivar el proveedor."
                            : "No fue posible activar el proveedor."
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
                title="Proveedores"
                description="Administra los proveedores y su información de contacto para compras y abastecimiento."
                descriptionWidth="wide"
            />

            <div className="flex flex-wrap justify-end gap-3">
                {isAdministrator && (
                    <button
                        type="button"
                        onClick={() => {
                            resetForm();
                            setActionError(null);
                            setSuccessMessage(null);
                            setIsFormOpen(true);
                        }}
                        aria-haspopup="dialog"
                        aria-controls="supplier-form-modal"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 motion-reduce:transition-none sm:w-auto"
                    >
                        Nuevo proveedor
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:w-auto"
                >
                    {loading && hasSupplierData ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {successMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800">
                    {successMessage}
                </div>
            )}

            <dl
                aria-label="Resumen de proveedores"
                className="grid gap-4 sm:grid-cols-3 [&>div:first-child]:border-sky-200 [&>div:first-child]:to-sky-50/70 [&>div:first-child_dd]:text-sky-800 [&>div:nth-child(2)]:border-emerald-200 [&>div:nth-child(2)]:to-emerald-50/60 [&>div:nth-child(2)_dd]:text-emerald-800"
            >
                <StatCard label="Total de proveedores" value={hasSupplierData ? summary.total : loading ? "…" : "—"} />
                <StatCard label="Proveedores activos" value={hasSupplierData ? summary.active : loading ? "…" : "—"} />
                <StatCard label="Proveedores inactivos" value={hasSupplierData ? summary.inactive : loading ? "…" : "—"} />
            </dl>

            <section aria-busy={loading} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Proveedores registrados
                        </h2>

                        {hasSupplierData && (
                            <p
                                role="status"
                                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold tabular-nums text-sky-800 ring-1 ring-inset ring-sky-200"
                            >
                                {
                                    filteredSuppliers.length
                                }{" "}
                                {filteredSuppliers.length ===
                                    1
                                    ? "resultado"
                                    : "resultados"}
                            </p>
                        )}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                            <label
                                htmlFor="supplier-search"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Buscar proveedores
                            </label>

                            <input
                                id="supplier-search"
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
                                autoComplete="off"
                                placeholder="Nombre, contacto, correo o teléfono"
                                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base sm:text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            />
                        </div>

                        <div className="sm:w-48 sm:shrink-0">
                            <label
                                htmlFor="supplier-status"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Estado
                            </label>

                            <select
                                id="supplier-status"
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
                                className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base sm:text-sm text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none"
                            >
                                <option value="all">
                                    Todos
                                </option>

                                <option value="active">
                                    Activos
                                </option>

                                <option value="inactive">
                                    Inactivos
                                </option>
                            </select>
                        </div>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={
                                    clearFilters
                                }
                                className="h-12 w-full shrink-0 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none sm:w-auto"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {actionError && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {loading && !hasSupplierData && <CatalogLoadingSkeleton label="Cargando proveedores..." />}

                {!loading &&
                    error && (
                        <div
                            role="alert"
                            className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                {hasSupplierData &&
                    suppliers.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">
                                Aún no hay proveedores registrados
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Los proveedores aparecerán aquí cuando se agreguen al catálogo.
                            </p>
                        </div>
                    )}

                {hasSupplierData &&
                    suppliers.length > 0 &&
                    filteredSuppliers.length ===
                    0 && (
                        <div className="m-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                            <p className="text-sm font-semibold text-slate-900">
                                No encontramos coincidencias.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                Prueba con otro término o elimina los filtros.
                            </p>
                        </div>
                    )}

                {hasSupplierData &&
                    filteredSuppliers.length >
                    0 && (
                        <div
                            className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200"
                            tabIndex={0}
                            role="region"
                            aria-label="Proveedores registrados"
                        >
                            <table className="w-full min-w-240 text-left text-sm">
                                <thead className="bg-sky-50/80 text-xs uppercase text-sky-800">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-4"
                                        >
                                            Proveedor
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-6 py-4"
                                        >
                                            Contacto
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-6 py-4"
                                        >
                                            Correo
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-6 py-4"
                                        >
                                            Teléfono
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-6 py-4"
                                        >
                                            Estado
                                        </th>


                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right"
                                        >
                                            Acciones
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredSuppliers.map(
                                        (
                                            supplier
                                        ) => (
                                            <tr
                                                key={
                                                    supplier.id
                                                }
                                                className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="px-6 py-5 font-semibold text-slate-900">
                                                    {
                                                        supplier.name
                                                    }
                                                </td>

                                                <td className="px-6 py-5 text-slate-600">
                                                    {supplier.contactName ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-5 text-slate-600">
                                                    {supplier.email ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-5 text-slate-600">
                                                    {supplier.phone ||
                                                        "—"}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <ActiveStatusBadge isActive={supplier.isActive} />
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col items-end gap-2 xl:flex-row xl:justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openSupplierProducts(
                                                                    supplier
                                                                )
                                                            }
                                                            className="inline-flex min-h-11 w-40 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none"
                                                        >
                                                            <svg
                                                                aria-hidden="true"
                                                                className="h-4 w-4 shrink-0"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <path d="M4 7h16M4 12h16M4 17h16" />
                                                            </svg>

                                                            Productos
                                                        </button>


                                                        {isAdministrator && (
                                                            <CatalogRowActions
                                                                isActive={
                                                                    supplier.isActive
                                                                }
                                                                isChanging={
                                                                    changingStatusId ===
                                                                    supplier.id
                                                                }
                                                                disabled={
                                                                    isSubmitting ||
                                                                    changingStatusId !==
                                                                    null
                                                                }
                                                                onEdit={() =>
                                                                    startEditing(
                                                                        supplier
                                                                    )
                                                                }
                                                                onToggleStatus={() =>
                                                                    void handleStatusChange(
                                                                        supplier
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </td>
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
                    id="supplier-form-modal"
                    title={editingSupplierId !== null ? "Editar proveedor" : "Nuevo proveedor"}
                    description={editingSupplierId !== null
                        ? "Modifica los datos del proveedor seleccionado."
                        : "Registra un proveedor para asociarlo posteriormente con sus productos."}
                    isSubmitting={isSubmitting}
                    onClose={cancelEditing}
                >
                    <form
                        noValidate
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6"
                    >
                        <fieldset
                            disabled={
                                isSubmitting
                            }
                            className="grid min-w-0 gap-6 [&>div]:min-w-0"
                        >
                            <div>
                                <label
                                    htmlFor="supplier-name"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Nombre del proveedor
                                </label>

                                <input
                                    id="supplier-name"
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
                                    autoComplete="organization"
                                    placeholder="Ej. Proveedor Industrial S.A. de C.V."
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />

                                {duplicateSupplier && (
                                    <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                                        Ya existe el proveedor "
                                        {
                                            duplicateSupplier.name
                                        }
                                        ".
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="supplier-contact"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Contacto
                                </label>

                                <input
                                    id="supplier-contact"
                                    value={
                                        contactName
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setContactName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    autoComplete="name"
                                    placeholder="Ej. Laura Martínez"
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="supplier-email"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Correo
                                </label>

                                <input
                                    id="supplier-email"
                                    type="email"
                                    aria-invalid={Boolean(contactErrors.email)}
                                    aria-describedby={contactErrors.email ? "supplier-email-error" : undefined}
                                    value={email}
                                    onChange={(
                                        event
                                    ) => {
                                        setEmail(
                                            event
                                                .target
                                                .value
                                        );
                                        setContactErrors((current) => ({ ...current, email: undefined }));
                                    }}
                                    autoComplete="email"
                                    placeholder="Ej. compras@proveedor.com"
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                                {contactErrors.email && (
                                    <p id="supplier-email-error" role="alert" className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                                        {contactErrors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="supplier-phone"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Teléfono
                                </label>

                                <input
                                    id="supplier-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    aria-invalid={Boolean(contactErrors.phone)}
                                    aria-describedby={contactErrors.phone ? "supplier-phone-hint supplier-phone-error" : "supplier-phone-hint"}
                                    value={phone}
                                    onKeyDown={(event) => {
                                        if (!event.ctrlKey && !event.metaKey && !event.altKey &&
                                            event.key.length === 1 && !/^[0-9]$/.test(event.key)) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onChange={(
                                        event
                                    ) => {
                                        setPhone(
                                            event
                                                .target
                                                .value
                                                .replace(/[^0-9]/g, "")
                                                .slice(0, 15)
                                        );
                                        setContactErrors((current) => ({ ...current, phone: undefined }));
                                    }}
                                    autoComplete="tel"
                                    placeholder="Ej. 8112345678"
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 aria-invalid:border-amber-500 aria-invalid:bg-amber-50/50 aria-invalid:focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 motion-reduce:transition-none"
                                />
                                <p id="supplier-phone-hint" className="mt-2 text-xs leading-5 text-slate-500">
                                    Opcional. Solo de 10 a 15 dígitos, sin espacios ni símbolos.
                                </p>
                                {contactErrors.phone && (
                                    <p id="supplier-phone-error" role="alert" className="mt-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                                        {contactErrors.phone}
                                    </p>
                                )}
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
                                    className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none sm:w-auto"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        Boolean(
                                            duplicateSupplier
                                        )
                                    }
                                    className="w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-sky-800 enabled:hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
                                >
                                    {isSubmitting
                                        ? "Guardando..."
                                        : editingSupplierId !==
                                            null
                                            ? "Guardar cambios"
                                            : "Crear proveedor"}
                                </button>
                            </div>
                        </fieldset>
                    </form>
                </CatalogFormModal>
            )}

            {selectedProductsSupplier && (
                <SupplierProductsModal
                    key={selectedProductsSupplier.id}
                    supplier={
                        selectedProductsSupplier
                    }

                    supplierProducts={
                        supplierProducts
                    }

                    loadingSupplierProducts={
                        loadingSupplierProducts
                    }

                    supplierProductsError={
                        supplierProductsError
                    }

                    hasLoadedSupplierProducts={
                        hasLoadedSupplierProducts
                    }

                    isAdministrator={
                        isAdministrator
                    }

                    onRefresh={() =>
                        void refreshSupplierProducts(
                            selectedProductsSupplier.id
                        )
                    }

                    onUpsertRelation={
                        upsertRelation
                    }

                    onClose={() =>
                        setSelectedProductsSupplier(
                            null
                        )
                    }
                />
            )}
        </div>
    );
};
