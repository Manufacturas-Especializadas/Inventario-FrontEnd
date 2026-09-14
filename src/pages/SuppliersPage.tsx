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

import { PageHeader } from "../components/ui/PageHeader";

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
        loading,
        error,
        refresh,
    } = useSuppliers();

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

                    await refresh();

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

                    await refresh();

                    resetForm();

                    setSuccessMessage(
                        `Proveedor "${createdSupplier.name}" creado correctamente.`
                    );
                }
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

                await refresh();

                if (
                    editingSupplierId ===
                    supplier.id &&
                    !updatedSupplier.isActive
                ) {
                    resetForm();
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

            {isAdministrator && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4h6v4M9 7h1m4 0h1M9 11h1m4 0h1" />
                            </svg>
                        </span>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingSupplierId !==
                                    null
                                    ? "Editar proveedor"
                                    : "Nuevo proveedor"}
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {editingSupplierId !==
                                    null
                                    ? "Modifica los datos del proveedor seleccionado."
                                    : "Registra un proveedor para asociarlo posteriormente con sus productos."}
                            </p>
                        </div>
                    </div>

                    {successMessage && (
                        <div
                            role="status"
                            className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800"
                        >
                            {successMessage}
                        </div>
                    )}

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
                            className="grid min-w-0 gap-6 md:grid-cols-2 [&>div]:min-w-0"
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
                                    className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 md:col-span-2"
                                >
                                    {formError}
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 md:col-span-2">
                                {editingSupplierId !==
                                    null && (
                                        <button
                                            type="button"
                                            onClick={
                                                cancelEditing
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
                </section>
            )}

            <dl
                aria-label="Resumen de proveedores"
                className="grid gap-4 sm:grid-cols-3"
            >
                {[
                    {
                        label:
                            "Total de proveedores",
                        value:
                            summary.total,
                        surface: "border-sky-200 from-white to-sky-50/70",
                        accent: "text-sky-800",
                    },
                    {
                        label:
                            "Proveedores activos",
                        value:
                            summary.active,
                        surface: "border-emerald-200 from-white to-emerald-50/60",
                        accent: "text-emerald-800",
                    },
                    {
                        label:
                            "Proveedores inactivos",
                        value:
                            summary.inactive,
                        surface: "border-slate-200 from-white to-slate-50/70",
                        accent: "text-slate-600",
                    },
                ].map((item) => (
                    <div
                        key={
                            item.label
                        }
                        className={`min-w-0 rounded-2xl border bg-linear-to-br px-6 py-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] ${item.surface}`}
                    >
                        <dt className="text-sm font-medium text-slate-600">
                            {
                                item.label
                            }
                        </dt>

                        <dd className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${item.accent}`}>
                            {loading
                                ? "…"
                                : error
                                    ? "—"
                                    : item.value}
                        </dd>
                    </div>
                ))}
            </dl>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            Proveedores registrados
                        </h2>

                        {!loading &&
                            !error && (
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

                {successMessage &&
                    !isAdministrator && (
                        <div
                            role="status"
                            className="m-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"
                        >
                            {
                                successMessage
                            }
                        </div>
                    )}

                {actionError && (
                    <div
                        role="alert"
                        className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {loading && (
                    <div
                        role="status"
                        className="m-6 rounded-xl border border-sky-100 bg-sky-50 px-6 py-8 text-center text-sm text-sky-800"
                    >
                        Cargando proveedores...
                    </div>
                )}

                {!loading &&
                    error && (
                        <div
                            role="alert"
                            className="m-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                {!loading &&
                    !error &&
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

                {!loading &&
                    !error &&
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

                {!loading &&
                    !error &&
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

                                        {isAdministrator && (
                                            <th
                                                scope="col"
                                                className="px-6 py-4 text-right"
                                            >
                                                Acciones
                                            </th>
                                        )}
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
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${supplier.isActive
                                                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                                            : "bg-slate-100 text-slate-600 ring-slate-200"
                                                            }`}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className="h-1.5 w-1.5 rounded-full bg-current"
                                                        />

                                                        {supplier.isActive
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
                                                                        supplier
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
                                                                        supplier
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingStatusId !==
                                                                    null ||
                                                                    isSubmitting
                                                                }
                                                                className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${supplier.isActive
                                                                    ? "border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:border-amber-300 enabled:hover:bg-amber-100 focus-visible:ring-amber-100"
                                                                    : "border-emerald-200 bg-emerald-50 text-emerald-800 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus-visible:ring-emerald-100"
                                                                    }`}
                                                            >
                                                                {changingStatusId ===
                                                                    supplier.id
                                                                    ? "Guardando..."
                                                                    : supplier.isActive
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
