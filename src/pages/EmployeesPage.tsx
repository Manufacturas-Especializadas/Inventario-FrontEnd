import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    useEmployees,
} from "../hooks/useEmployees";

import {
    useOrganizationalUnits,
} from "../hooks/useOrganizationalUnits";

import type {
    Employee,
    OrganizationalUnitType,
} from "../types/types";


type StatusFilter =
    | "all"
    | "active"
    | "inactive";


const getUnitTypeLabel = (
    type:
        OrganizationalUnitType | null
) => {
    switch (type) {
        case 1:
            return "Departamento";

        case 2:
            return "Área";

        case 3:
            return "Línea";

        case 4:
            return "Subárea";

        case 5:
            return "Equipo";

        default:
            return "";
    }
};


export const EmployeesPage = () => {
    const {
        employees,

        loading,
        saving,
        changingStatusId,

        error,

        createEmployee,
        updateEmployee,
        setEmployeeStatus,

        clearError,
    } = useEmployees();


    const {
        organizationalUnits,
        loading:
        loadingOrganizationalUnits,
    } =
        useOrganizationalUnits();


    const [
        search,
        setSearch,
    ] = useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState<StatusFilter>(
            "all"
        );


    const [
        showForm,
        setShowForm,
    ] = useState(false);

    const [
        editingEmployeeId,
        setEditingEmployeeId,
    ] = useState<
        number | null
    >(null);


    const [
        employeeNumber,
        setEmployeeNumber,
    ] = useState("");

    const [
        name,
        setName,
    ] = useState("");

    const [
        organizationalUnitId,
        setOrganizationalUnitId,
    ] = useState("");


    const [
        formError,
        setFormError,
    ] = useState<
        string | null
    >(null);

    const [
        successMessage,
        setSuccessMessage,
    ] = useState<
        string | null
    >(null);


    const activeUnits =
        useMemo(
            () =>
                organizationalUnits
                    .filter(
                        (unit) =>
                            unit.isActive
                    )
                    .sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name,
                                "es"
                            )
                    ),
            [
                organizationalUnits,
            ]
        );


    const filteredEmployees =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLocaleLowerCase(
                        "es"
                    );

            return employees
                .filter(
                    (employee) => {
                        if (
                            statusFilter ===
                            "active" &&
                            !employee.isActive
                        ) {
                            return false;
                        }

                        if (
                            statusFilter ===
                            "inactive" &&
                            employee.isActive
                        ) {
                            return false;
                        }

                        if (
                            !normalizedSearch
                        ) {
                            return true;
                        }

                        return (
                            employee.employeeNumber
                                .toLocaleLowerCase(
                                    "es"
                                )
                                .includes(
                                    normalizedSearch
                                ) ||
                            employee.name
                                .toLocaleLowerCase(
                                    "es"
                                )
                                .includes(
                                    normalizedSearch
                                ) ||
                            employee.organizationalUnitName
                                ?.toLocaleLowerCase(
                                    "es"
                                )
                                .includes(
                                    normalizedSearch
                                ) ===
                            true
                        );
                    }
                )
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name,
                            "es"
                        )
                );
        }, [
            employees,
            search,
            statusFilter,
        ]);


    const resetForm = () => {
        setEditingEmployeeId(
            null
        );

        setEmployeeNumber("");
        setName("");

        setOrganizationalUnitId(
            ""
        );

        setFormError(null);
    };


    const openCreateForm =
        () => {
            clearError();

            setSuccessMessage(
                null
            );

            resetForm();

            setShowForm(
                true
            );
        };


    const openEditForm = (
        employee: Employee
    ) => {
        clearError();

        setSuccessMessage(
            null
        );

        setFormError(
            null
        );

        setEditingEmployeeId(
            employee.id
        );

        setEmployeeNumber(
            employee.employeeNumber
        );

        setName(
            employee.name
        );

        setOrganizationalUnitId(
            employee
                .organizationalUnitId
                ? String(
                    employee
                        .organizationalUnitId
                )
                : ""
        );

        setShowForm(
            true
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const closeForm = () => {
        resetForm();

        setShowForm(
            false
        );
    };


    const handleSubmit =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();

            setFormError(
                null
            );

            setSuccessMessage(
                null
            );

            clearError();


            const normalizedNumber =
                employeeNumber.trim();

            const normalizedName =
                name.trim();

            const parsedUnitId =
                Number(
                    organizationalUnitId
                );


            if (
                !normalizedNumber
            ) {
                setFormError(
                    "El número de empleado es obligatorio."
                );

                return;
            }


            if (
                normalizedNumber.length >
                20
            ) {
                setFormError(
                    "El número de empleado no puede superar los 20 caracteres."
                );

                return;
            }


            if (!normalizedName) {
                setFormError(
                    "El nombre del empleado es obligatorio."
                );

                return;
            }


            if (
                normalizedName.length >
                150
            ) {
                setFormError(
                    "El nombre no puede superar los 150 caracteres."
                );

                return;
            }


            if (
                !Number.isInteger(
                    parsedUnitId
                ) ||
                parsedUnitId <= 0
            ) {
                setFormError(
                    "Selecciona una unidad organizacional."
                );

                return;
            }


            if (
                editingEmployeeId
            ) {
                const result =
                    await updateEmployee({
                        id:
                            editingEmployeeId,

                        employeeNumber:
                            normalizedNumber,

                        name:
                            normalizedName,

                        organizationalUnitId:
                            parsedUnitId,
                    });


                if (!result) {
                    return;
                }


                setSuccessMessage(
                    `Empleado "${result.name}" actualizado correctamente.`
                );
            } else {
                const result =
                    await createEmployee({
                        employeeNumber:
                            normalizedNumber,

                        name:
                            normalizedName,

                        organizationalUnitId:
                            parsedUnitId,
                    });


                if (!result) {
                    return;
                }


                setSuccessMessage(
                    `Empleado "${result.name}" creado correctamente.`
                );
            }


            closeForm();
        };


    const handleChangeStatus =
        async (
            employee: Employee
        ) => {
            setSuccessMessage(
                null
            );

            setFormError(
                null
            );

            clearError();


            if (
                employee.isActive
            ) {
                const confirmed =
                    window.confirm(
                        `¿Deseas desactivar al empleado "${employee.name}"?`
                    );

                if (!confirmed) {
                    return;
                }
            }


            const result =
                await setEmployeeStatus(
                    employee.id,
                    !employee.isActive
                );


            if (!result) {
                return;
            }


            setSuccessMessage(
                result.isActive
                    ? `Empleado "${result.name}" activado correctamente.`
                    : `Empleado "${result.name}" desactivado correctamente.`
            );
        };


    const activeCount =
        employees.filter(
            (employee) =>
                employee.isActive
        ).length;

    const inactiveCount =
        employees.length -
        activeCount;


    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* Header */}

            <div className="relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        MESA · Administración
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        Empleados
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        Administra los
                        empleados que
                        participan en el
                        sistema.
                    </p>
                </div>


                <button
                    type="button"
                    onClick={
                        openCreateForm
                    }
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Nuevo empleado
                </button>
            </div>


            {(formError ||
                error) && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {formError ||
                            error}
                    </div>
                )}


            {successMessage && (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-800">
                    {
                        successMessage
                    }
                </div>
            )}


            {/* Formulario */}

            {showForm && (
                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                    <div className="border-b border-slate-100 pb-6">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Datos del empleado</p>
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            {editingEmployeeId
                                ? "Editar empleado"
                                : "Nuevo empleado"}
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                            {editingEmployeeId
                                ? "Modifica los datos maestros del empleado."
                                : "Registra un nuevo empleado en el sistema."}
                        </p>
                    </div>


                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="mt-6"
                    >
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
                            <div>
                                <label htmlFor="employee-number" className="block text-sm font-medium text-slate-700">
                                    Número de
                                    empleado
                                </label>

                                <input
                                    type="text"
                                    id="employee-number"
                                    value={
                                        employeeNumber
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setEmployeeNumber(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        20
                                    }
                                    disabled={
                                        saving
                                    }
                                    placeholder="Ej. 7162"
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>


                            <div>
                                <label htmlFor="employee-name" className="block text-sm font-medium text-slate-700">
                                    Nombre
                                </label>

                                <input
                                    type="text"
                                    id="employee-name"
                                    value={
                                        name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        150
                                    }
                                    disabled={
                                        saving
                                    }
                                    placeholder="Nombre completo"
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>


                            <div>
                                <label htmlFor="employee-unit" className="block text-sm font-medium text-slate-700">
                                    Unidad
                                    organizacional
                                </label>

                                <select
                                    id="employee-unit"
                                    value={
                                        organizationalUnitId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setOrganizationalUnitId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    disabled={
                                        saving ||
                                        loadingOrganizationalUnits
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                >
                                    <option value="">
                                        Selecciona
                                        una unidad
                                    </option>

                                    {activeUnits.map(
                                        (
                                            unit
                                        ) => (
                                            <option
                                                key={
                                                    unit.id
                                                }
                                                value={
                                                    unit.id
                                                }
                                            >
                                                {
                                                    unit.name
                                                }
                                                {" — "}
                                                {getUnitTypeLabel(
                                                    unit.type
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>


                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={
                                    closeForm
                                }
                                disabled={
                                    saving
                                }
                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    saving
                                }
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                                {saving
                                    ? "Guardando..."
                                    : editingEmployeeId
                                        ? "Guardar cambios"
                                        : "Crear empleado"}
                            </button>
                        </div>
                    </form>
                </section>
            )}


            {/* Resumen */}

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="min-w-0 rounded-2xl border border-sky-200 bg-linear-to-br from-white to-sky-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Total
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-sky-800">
                        {
                            employees.length
                        }
                    </p>
                </div>


                <div className="min-w-0 rounded-2xl border border-emerald-200 bg-linear-to-br from-white to-emerald-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Activos
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-emerald-800">
                        {
                            activeCount
                        }
                    </p>
                </div>


                <div className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Inactivos
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                        {
                            inactiveCount
                        }
                    </p>
                </div>
            </div>


            {/* Tabla */}

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                Empleados
                                registrados
                            </h2>

                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                {
                                    filteredEmployees.length
                                }{" "}
                                resultado
                                {filteredEmployees.length ===
                                    1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>


                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 space-y-2 sm:w-72">
                                <label htmlFor="employee-search" className="block text-sm font-medium text-slate-700">Buscar empleado</label>
                                <input
                                    id="employee-search"
                                    type="search"
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Buscar empleado..."
                                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>


                            <div className="min-w-0 space-y-2 sm:w-40">
                                <label htmlFor="employee-status" className="block text-sm font-medium text-slate-700">Estado</label>
                                <select
                                    id="employee-status"
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
                                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
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
                        </div>
                    </div>
                </div>


                {loading && (
                    <div role="status" className="flex flex-col items-center gap-4 px-6 py-14 text-center text-sm text-slate-600">
                        <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-sky-100 border-t-sky-600 motion-reduce:animate-none" />
                        Cargando
                        empleados...
                    </div>
                )}


                {!loading &&
                    filteredEmployees.length ===
                    0 && (
                        <div role="status" className="px-6 py-14 text-center">
                            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                    <path d="m16 16 4 4" />
                                </svg>
                            </span>
                            <p className="text-sm font-medium text-slate-700">
                                No se
                                encontraron
                                empleados.
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-500">Revisa la búsqueda y el estado seleccionado.</p>
                        </div>
                    )}


                {!loading &&
                    filteredEmployees.length >
                    0 && (
                        <div tabIndex={0} role="region" aria-label="Listado de empleados" className="overflow-x-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200">
                            <table className="w-full min-w-200 divide-y divide-slate-200">
                                <thead className="bg-slate-50/80">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        <th scope="col" className="px-6 py-4">
                                            No.
                                            empleado
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Nombre
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Unidad
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Estado
                                        </th>

                                        <th scope="col" className="px-6 py-4 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>


                                <tbody className="divide-y divide-slate-100">
                                    {filteredEmployees.map(
                                        (
                                            employee
                                        ) => (
                                            <tr
                                                key={
                                                    employee.id
                                                }
                                                className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                            >
                                                <td className="whitespace-nowrap px-6 py-5 font-mono text-sm font-semibold text-sky-800">
                                                    {
                                                        employee.employeeNumber
                                                    }
                                                </td>


                                                <td className="px-6 py-4">
                                                    <p className="max-w-xs wrap-anywhere text-sm font-semibold text-slate-900">
                                                        {
                                                            employee.name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-500">
                                                        ID:{" "}
                                                        {
                                                            employee.id
                                                        }
                                                    </p>
                                                </td>


                                                <td className="px-6 py-4">
                                                    {employee.organizationalUnitName ? (
                                                        <>
                                                            <p className="text-sm font-medium text-slate-700">
                                                                {
                                                                    employee.organizationalUnitName
                                                                }
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {getUnitTypeLabel(
                                                                    employee.organizationalUnitType
                                                                )}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">
                                                            Sin
                                                            unidad
                                                        </span>
                                                    )}
                                                </td>


                                                <td className="px-6 py-4">
                                                    <span
                                                        className={
                                                            employee.isActive
                                                                ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                                                : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
                                                        }
                                                    >
                                                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                                        {employee.isActive
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </span>
                                                </td>


                                                <td className="whitespace-nowrap px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditForm(
                                                                    employee
                                                                )
                                                            }
                                                            disabled={
                                                                saving ||
                                                                changingStatusId ===
                                                                employee.id
                                                            }
                                                            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                        >
                                                            Editar
                                                        </button>


                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                void handleChangeStatus(
                                                                    employee
                                                                )
                                                            }
                                                            disabled={
                                                                changingStatusId ===
                                                                employee.id
                                                            }
                                                            className={
                                                                employee.isActive
                                                                    ? "min-h-11 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-colors enabled:hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                                    : "min-h-11 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors enabled:hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                            }
                                                        >
                                                            {changingStatusId ===
                                                                employee.id
                                                                ? "Guardando..."
                                                                : employee.isActive
                                                                    ? "Desactivar"
                                                                    : "Activar"}
                                                        </button>
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
        </div>
    );
};
