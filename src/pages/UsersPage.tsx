import {
    useMemo,
    useState,
    type FormEvent,
} from "react";

import {
    useAuth,
} from "../hooks/useAuth";

import {
    useEmployees,
} from "../hooks/useEmployees";

import {
    useUsers,
} from "../hooks/useUsers";

import type {
    AdminUser,
    UserRole,
} from "../types/types";


type StatusFilter =
    | "all"
    | "active"
    | "inactive";


type FormMode =
    | "create"
    | "username"
    | "roles"
    | "password"
    | null;


const availableRoles:
    UserRole[] = [
        "Administrator",
        "Production",
        "Warehouse",
        "Viewer",
    ];


const getRoleLabel = (
    role: UserRole
) => {
    switch (role) {
        case "Administrator":
            return "Administrador";

        case "Production":
            return "Producción";

        case "Warehouse":
            return "Almacén";

        case "Viewer":
            return "Consulta";
    }
};


const formatDate = (
    value: string | null
) => {
    if (!value) {
        return "Nunca";
    }

    return new Intl.DateTimeFormat(
        "es-MX",
        {
            dateStyle: "medium",
            timeStyle: "short",
        }
    ).format(
        new Date(value)
    );
};


export const UsersPage = () => {
    const {
        user:
        authenticatedUser,
    } = useAuth();


    const {
        employees,
    } = useEmployees();


    const {
        users,

        loading,
        creating,

        updatingId,
        changingRolesId,
        resettingPasswordId,
        changingStatusId,

        error,

        createUser,
        updateUser,
        setUserRoles,
        resetUserPassword,
        setUserStatus,

        clearError,
    } = useUsers();


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
        formMode,
        setFormMode,
    ] =
        useState<FormMode>(
            null
        );


    const [
        selectedUser,
        setSelectedUser,
    ] =
        useState<AdminUser | null>(
            null
        );


    /*
     * Crear usuario
     */

    const [
        employeeNumber,
        setEmployeeNumber,
    ] = useState("");

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        selectedRoles,
        setSelectedRoles,
    ] = useState<UserRole[]>([
        "Viewer",
    ]);


    /*
     * Restablecer contraseña
     */

    const [
        newPassword,
        setNewPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
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


    const usersByEmployeeId =
        useMemo(
            () =>
                new Set(
                    users.map(
                        (user) =>
                            user.employeeId
                    )
                ),
            [users]
        );


    const availableEmployees =
        useMemo(
            () =>
                employees
                    .filter(
                        (employee) =>
                            employee.isActive &&
                            !usersByEmployeeId.has(
                                employee.id
                            )
                    )
                    .sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name,
                                "es"
                            )
                    ),
            [
                employees,
                usersByEmployeeId,
            ]
        );


    const filteredUsers =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLocaleLowerCase(
                        "es"
                    );


            return users.filter(
                (user) => {
                    if (
                        statusFilter ===
                        "active" &&
                        !user.isActive
                    ) {
                        return false;
                    }


                    if (
                        statusFilter ===
                        "inactive" &&
                        user.isActive
                    ) {
                        return false;
                    }


                    if (
                        !normalizedSearch
                    ) {
                        return true;
                    }


                    return (
                        user.username
                            .toLocaleLowerCase(
                                "es"
                            )
                            .includes(
                                normalizedSearch
                            ) ||
                        user.employeeName
                            .toLocaleLowerCase(
                                "es"
                            )
                            .includes(
                                normalizedSearch
                            ) ||
                        user.employeeNumber
                            .toLocaleLowerCase(
                                "es"
                            )
                            .includes(
                                normalizedSearch
                            ) ||
                        user.roles.some(
                            (role) =>
                                role
                                    .toLocaleLowerCase()
                                    .includes(
                                        normalizedSearch
                                    )
                        )
                    );
                }
            );
        }, [
            users,
            search,
            statusFilter,
        ]);


    const closeForm = () => {
        setFormMode(
            null
        );

        setSelectedUser(
            null
        );

        setEmployeeNumber(
            ""
        );

        setUsername(
            ""
        );

        setPassword(
            ""
        );

        setSelectedRoles([
            "Viewer",
        ]);

        setNewPassword(
            ""
        );

        setConfirmPassword(
            ""
        );

        setFormError(
            null
        );
    };


    const openCreateForm =
        () => {
            clearError();

            setSuccessMessage(
                null
            );

            closeForm();

            setFormMode(
                "create"
            );
        };


    const openUsernameForm = (
        user: AdminUser
    ) => {
        clearError();

        setSuccessMessage(
            null
        );

        closeForm();

        setSelectedUser(
            user
        );

        setUsername(
            user.username
        );

        setFormMode(
            "username"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const openRolesForm = (
        user: AdminUser
    ) => {
        clearError();

        setSuccessMessage(
            null
        );

        closeForm();

        setSelectedUser(
            user
        );

        setSelectedRoles([
            ...user.roles,
        ]);

        setFormMode(
            "roles"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const openPasswordForm = (
        user: AdminUser
    ) => {
        clearError();

        setSuccessMessage(
            null
        );

        closeForm();

        setSelectedUser(
            user
        );

        setFormMode(
            "password"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const toggleRole = (
        role: UserRole
    ) => {
        const alreadySelected =
            selectedRoles.includes(
                role
            );


        /*
         * Evita desde UI que el administrador
         * elimine su propio rol Administrator.
         * El backend también lo protege.
         */
        if (
            selectedUser?.id ===
            authenticatedUser?.userId &&
            role ===
            "Administrator" &&
            alreadySelected
        ) {
            return;
        }


        setSelectedRoles(
            (current) =>
                alreadySelected
                    ? current.filter(
                        (item) =>
                            item !== role
                    )
                    : [
                        ...current,
                        role,
                    ]
        );
    };


    const handleCreate =
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


            if (
                !employeeNumber
            ) {
                setFormError(
                    "Selecciona un empleado."
                );

                return;
            }


            const normalizedUsername =
                username.trim();


            if (
                !normalizedUsername
            ) {
                setFormError(
                    "El nombre de usuario es obligatorio."
                );

                return;
            }


            if (
                normalizedUsername.length >
                100
            ) {
                setFormError(
                    "El nombre de usuario no puede superar los 100 caracteres."
                );

                return;
            }


            if (
                password.length < 8 ||
                password.length > 64
            ) {
                setFormError(
                    "La contraseña debe tener entre 8 y 64 caracteres."
                );

                return;
            }


            if (
                selectedRoles.length ===
                0
            ) {
                setFormError(
                    "Selecciona al menos un rol."
                );

                return;
            }


            const result =
                await createUser({
                    employeeNumber,
                    username:
                        normalizedUsername,

                    password,

                    roles:
                        selectedRoles,
                });


            if (!result) {
                return;
            }


            setSuccessMessage(
                `Usuario "${result.username}" creado correctamente.`
            );

            closeForm();
        };


    const handleUpdateUsername =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();


            if (!selectedUser) {
                return;
            }


            setFormError(
                null
            );

            setSuccessMessage(
                null
            );

            clearError();


            const normalizedUsername =
                username.trim();


            if (
                !normalizedUsername
            ) {
                setFormError(
                    "El nombre de usuario es obligatorio."
                );

                return;
            }


            if (
                normalizedUsername.length >
                100
            ) {
                setFormError(
                    "El nombre de usuario no puede superar los 100 caracteres."
                );

                return;
            }


            const result =
                await updateUser(
                    selectedUser.id,
                    {
                        username:
                            normalizedUsername,
                    }
                );


            if (!result) {
                return;
            }


            setSuccessMessage(
                `Usuario actualizado a "${result.username}".`
            );

            closeForm();
        };


    const handleSaveRoles =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();


            if (!selectedUser) {
                return;
            }


            setFormError(
                null
            );

            setSuccessMessage(
                null
            );

            clearError();


            if (
                selectedRoles.length ===
                0
            ) {
                setFormError(
                    "El usuario debe tener al menos un rol."
                );

                return;
            }


            const result =
                await setUserRoles(
                    selectedUser.id,
                    {
                        roles:
                            selectedRoles,
                    }
                );


            if (!result) {
                return;
            }


            setSuccessMessage(
                `Roles de "${result.username}" actualizados correctamente.`
            );

            closeForm();
        };


    const handleResetPassword =
        async (
            event:
                FormEvent<HTMLFormElement>
        ) => {
            event.preventDefault();


            if (!selectedUser) {
                return;
            }


            setFormError(
                null
            );

            setSuccessMessage(
                null
            );

            clearError();


            if (
                newPassword.length <
                8 ||
                newPassword.length >
                64
            ) {
                setFormError(
                    "La contraseña debe tener entre 8 y 64 caracteres."
                );

                return;
            }


            if (
                newPassword !==
                confirmPassword
            ) {
                setFormError(
                    "Las contraseñas no coinciden."
                );

                return;
            }


            const result =
                await resetUserPassword(
                    selectedUser.id,
                    newPassword
                );


            if (!result) {
                return;
            }


            setSuccessMessage(
                `Contraseña de "${result.username}" restablecida correctamente.`
            );

            closeForm();
        };


    const handleChangeStatus =
        async (
            user: AdminUser
        ) => {
            clearError();

            setFormError(
                null
            );

            setSuccessMessage(
                null
            );


            if (
                user.id ===
                authenticatedUser?.userId &&
                user.isActive
            ) {
                setFormError(
                    "No puedes desactivar tu propia cuenta."
                );

                return;
            }


            if (
                !user.isActive &&
                !user.employeeIsActive
            ) {
                setFormError(
                    `No puedes activar "${user.username}" porque el empleado está inactivo.`
                );

                return;
            }


            if (user.isActive) {
                const confirmed =
                    window.confirm(
                        `¿Deseas desactivar el acceso de "${user.username}"?`
                    );

                if (!confirmed) {
                    return;
                }
            }


            const result =
                await setUserStatus(
                    user.id,
                    !user.isActive
                );


            if (!result) {
                return;
            }


            setSuccessMessage(
                result.isActive
                    ? `Usuario "${result.username}" activado correctamente.`
                    : `Usuario "${result.username}" desactivado correctamente.`
            );
        };


    const activeUsers =
        users.filter(
            (user) =>
                user.isActive
        ).length;


    const effectiveAccessUsers =
        users.filter(
            (user) =>
                user.isActive &&
                user.employeeIsActive
        ).length;


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
                        Usuarios
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        Administra las
                        cuentas, roles y
                        permisos de acceso
                        al sistema.
                    </p>
                </div>


                <button
                    type="button"
                    onClick={
                        openCreateForm
                    }
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                    <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Nuevo usuario
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


            {/* Crear */}

            {formMode ===
                "create" && (
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <h2 className="wrap-anywhere text-lg font-semibold tracking-tight text-slate-900">
                            Nuevo usuario
                        </h2>

                        <p className="mt-1 wrap-anywhere text-sm leading-6 text-slate-500">
                            Solo aparecen
                            empleados activos
                            que todavía no
                            tienen una cuenta.
                        </p>


                        <form
                            onSubmit={
                                handleCreate
                            }
                            className="mt-6 border-t border-slate-100 pt-6"
                        >
                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
                                <div>
                                    <label htmlFor="user-employee" className="block text-sm font-medium text-slate-700">
                                        Empleado
                                    </label>

                                    <select
                                        id="user-employee"
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
                                        disabled={
                                            creating
                                        }
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    >
                                        <option value="">
                                            Selecciona
                                            un empleado
                                        </option>

                                        {availableEmployees.map(
                                            (
                                                employee
                                            ) => (
                                                <option
                                                    key={
                                                        employee.id
                                                    }
                                                    value={
                                                        employee.employeeNumber
                                                    }
                                                >
                                                    {
                                                        employee.employeeNumber
                                                    }
                                                    {" — "}
                                                    {
                                                        employee.name
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>


                                <div>
                                    <label htmlFor="user-username" className="block text-sm font-medium text-slate-700">
                                        Usuario
                                    </label>

                                    <input
                                        type="text"
                                        id="user-username"
                                        value={
                                            username
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setUsername(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        maxLength={
                                            100
                                        }
                                        disabled={
                                            creating
                                        }
                                        placeholder="Ej. jperez"
                                        autoComplete="off"
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    />
                                </div>


                                <div>
                                    <label htmlFor="user-password" className="block text-sm font-medium text-slate-700">
                                        Contraseña
                                        inicial
                                    </label>

                                    <input
                                        type="password"
                                        id="user-password"
                                        value={
                                            password
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setPassword(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        minLength={
                                            8
                                        }
                                        maxLength={
                                            64
                                        }
                                        disabled={
                                            creating
                                        }
                                        autoComplete="new-password"
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    />
                                </div>
                            </div>


                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                                <p className="text-sm font-medium text-slate-700">
                                    Roles
                                </p>

                                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {availableRoles.map(
                                        (role) => (
                                            <label
                                                key={
                                                    role
                                                }
                                                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 has-checked:border-sky-300 has-checked:bg-sky-50 has-checked:text-sky-900 has-checked:shadow-sm has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:ring-4 has-focus-visible:ring-sky-100 motion-reduce:transition-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 shrink-0 accent-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                                                    checked={selectedRoles.includes(
                                                        role
                                                    )}
                                                    onChange={() =>
                                                        toggleRole(
                                                            role
                                                        )
                                                    }
                                                />

                                                {getRoleLabel(
                                                    role
                                                )}
                                            </label>
                                        )
                                    )}
                                </div>
                            </div>


                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    disabled={
                                        creating
                                    }
                                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        creating
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                >
                                    {creating
                                        ? "Creando..."
                                        : "Crear usuario"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}


            {/* Editar username */}

            {formMode ===
                "username" &&
                selectedUser && (
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <h2 className="wrap-anywhere text-lg font-semibold tracking-tight text-slate-900">
                            Editar usuario
                        </h2>

                        <p className="mt-1 wrap-anywhere text-sm leading-6 text-slate-500">
                            {
                                selectedUser.employeeName
                            }
                        </p>


                        <form
                            onSubmit={
                                handleUpdateUsername
                            }
                            className="mt-6 border-t border-slate-100 pt-6"
                        >
                            <div className="max-w-md">
                                <label htmlFor="user-edit-username" className="block text-sm font-medium text-slate-700">
                                    Nombre de
                                    usuario
                                </label>

                                <input
                                    type="text"
                                    id="user-edit-username"
                                    value={
                                        username
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setUsername(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    maxLength={
                                        100
                                    }
                                    className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>


                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        updatingId ===
                                        selectedUser.id
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </section>
                )}


            {/* Roles */}

            {formMode ===
                "roles" &&
                selectedUser && (
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <h2 className="wrap-anywhere text-lg font-semibold tracking-tight text-slate-900">
                            Roles de{" "}
                            {
                                selectedUser.username
                            }
                        </h2>


                        {selectedUser.id ===
                            authenticatedUser?.userId && (
                                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                    No puedes
                                    quitar el rol
                                    Administrador
                                    de tu propia
                                    cuenta.
                                </p>
                            )}


                        <form
                            onSubmit={
                                handleSaveRoles
                            }
                            className="mt-6 border-t border-slate-100 pt-6"
                        >
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {availableRoles.map(
                                    (role) => {
                                        const protectedAdministrator =
                                            selectedUser.id ===
                                            authenticatedUser?.userId &&
                                            role ===
                                            "Administrator" &&
                                            selectedRoles.includes(
                                                role
                                            );

                                        return (
                                            <label
                                                key={
                                                    role
                                                }
                                                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-sky-300 has-checked:border-sky-300 has-checked:bg-sky-50 has-checked:text-sky-900 has-checked:shadow-sm has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:ring-4 has-focus-visible:ring-sky-100 motion-reduce:transition-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 shrink-0 accent-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                                                    checked={selectedRoles.includes(
                                                        role
                                                    )}
                                                    disabled={
                                                        protectedAdministrator
                                                    }
                                                    onChange={() =>
                                                        toggleRole(
                                                            role
                                                        )
                                                    }
                                                />

                                                {getRoleLabel(
                                                    role
                                                )}
                                            </label>
                                        );
                                    }
                                )}
                            </div>


                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        changingRolesId ===
                                        selectedUser.id
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                >
                                    Guardar roles
                                </button>
                            </div>
                        </form>
                    </section>
                )}


            {/* Password */}

            {formMode ===
                "password" &&
                selectedUser && (
                    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                        <h2 className="wrap-anywhere text-lg font-semibold tracking-tight text-slate-900">
                            Restablecer
                            contraseña
                        </h2>

                        <p className="mt-1 wrap-anywhere text-sm leading-6 text-slate-500">
                            Usuario:{" "}
                            {
                                selectedUser.username
                            }
                        </p>


                        <form
                            onSubmit={
                                handleResetPassword
                            }
                            className="mt-6 border-t border-slate-100 pt-6"
                        >
                            <div className="grid max-w-2xl gap-5 md:grid-cols-2 [&>div]:min-w-0">
                                <div>
                                    <label htmlFor="user-new-password" className="block text-sm font-medium text-slate-700">
                                        Nueva
                                        contraseña
                                    </label>

                                    <input
                                        type="password"
                                        id="user-new-password"
                                        value={
                                            newPassword
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setNewPassword(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        minLength={
                                            8
                                        }
                                        maxLength={
                                            64
                                        }
                                        autoComplete="new-password"
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    />
                                </div>


                                <div>
                                    <label htmlFor="user-confirm-password" className="block text-sm font-medium text-slate-700">
                                        Confirmar
                                        contraseña
                                    </label>

                                    <input
                                        type="password"
                                        id="user-confirm-password"
                                        value={
                                            confirmPassword
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setConfirmPassword(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        minLength={
                                            8
                                        }
                                        maxLength={
                                            64
                                        }
                                        autoComplete="new-password"
                                        className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                    />
                                </div>
                            </div>


                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={
                                        closeForm
                                    }
                                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        resettingPasswordId ===
                                        selectedUser.id
                                    }
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                                >
                                    Restablecer
                                    contraseña
                                </button>
                            </div>
                        </form>
                    </section>
                )}


            {/* Resumen */}

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="min-w-0 rounded-2xl border border-sky-200 bg-linear-to-br from-white to-sky-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Usuarios
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-sky-800">
                        {
                            users.length
                        }
                    </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-slate-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Cuentas activas
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
                        {
                            activeUsers
                        }
                    </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-emerald-200 bg-linear-to-br from-white to-emerald-50/70 p-5 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-6">
                    <p className="text-sm text-slate-500">
                        Acceso efectivo
                    </p>

                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-emerald-800">
                        {
                            effectiveAccessUsers
                        }
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Cuenta y empleado activos</p>
                </div>
            </div>


            {/* Tabla */}

            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="wrap-anywhere text-lg font-semibold tracking-tight text-slate-900">
                                Usuarios
                                registrados
                            </h2>

                            <p className="mt-1 wrap-anywhere text-sm leading-6 text-slate-500">
                                {
                                    filteredUsers.length
                                }{" "}
                                resultado
                                {filteredUsers.length ===
                                    1
                                    ? ""
                                    : "s"}
                            </p>
                        </div>


                        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 space-y-2 sm:w-64">
                                <label htmlFor="user-search" className="block text-sm font-medium text-slate-700">Buscar usuario</label>
                                <input
                                    id="user-search"
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
                                    placeholder="Buscar..."
                                    className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 enabled:hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none"
                                />
                            </div>

                            <div className="min-w-0 space-y-2 sm:w-44">
                                <label htmlFor="user-status" className="block text-sm font-medium text-slate-700">Estado de cuenta</label>
                                <select
                                    id="user-status"
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
                        </div>
                    </div>
                </div>


                {loading && (
                    <div role="status" className="flex flex-col items-center gap-4 px-6 py-14 text-center text-sm text-slate-600">
                        <span aria-hidden="true" className="h-8 w-8 animate-spin rounded-full border-2 border-sky-100 border-t-sky-600 motion-reduce:animate-none" />
                        Cargando
                        usuarios...
                    </div>
                )}


                {!loading &&
                    filteredUsers.length ===
                    0 && (
                        <div role="status" className="flex flex-col items-center gap-4 px-6 py-14 text-center text-sm text-slate-600">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                                <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="10.5" cy="10.5" r="6.5" />
                                    <path d="m16 16 4 4" />
                                </svg>
                            </span>
                            <p className="font-semibold text-slate-700">
                            No se
                            encontraron
                            usuarios.
                            </p>
                            <p className="text-sm leading-6 text-slate-500">Revisa la búsqueda y el estado de cuenta seleccionado.</p>
                        </div>
                    )}


                {!loading &&
                    filteredUsers.length >
                    0 && (
                        <div tabIndex={0} role="region" aria-label="Listado de usuarios" className="overflow-x-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-200">
                            <table className="w-full min-w-240 divide-y divide-slate-200">
                                <thead className="bg-slate-50/80">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                        <th scope="col" className="px-6 py-4">
                                            Empleado
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Usuario
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Roles
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Estado
                                        </th>

                                        <th scope="col" className="px-6 py-4">
                                            Último
                                            acceso
                                        </th>

                                        <th scope="col" className="px-6 py-4 text-right">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>


                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map(
                                        (
                                            user
                                        ) => {
                                            const isOwnUser =
                                                user.id ===
                                                authenticatedUser?.userId;

                                            const canActivate =
                                                user.employeeIsActive;

                                            return (
                                                <tr
                                                    key={
                                                        user.id
                                                    }
                                                    className="transition-colors hover:bg-sky-50/50 focus-within:bg-sky-50/50 motion-reduce:transition-none"
                                                >
                                                    <td className="px-6 py-4">
                                                        <p className="min-w-36 max-w-xs wrap-anywhere text-sm font-semibold text-slate-900">
                                                            {
                                                                user.employeeName
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {
                                                                user.employeeNumber
                                                            }
                                                        </p>

                                                        {!user.employeeIsActive && (
                                                            <p className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                                                                Empleado
                                                                inactivo
                                                            </p>
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4">
                                                        <p className="max-w-48 wrap-anywhere text-sm font-semibold text-sky-800">
                                                            {
                                                                user.username
                                                            }
                                                        </p>

                                                        {isOwnUser && (
                                                            <p className="mt-2 inline-flex rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200">
                                                                Tu cuenta
                                                            </p>
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4">
                                                        <div className="flex min-w-28 max-w-xs flex-wrap gap-1.5">
                                                            {user.roles.map(
                                                                (
                                                                    role
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            role
                                                                        }
                                                                        className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200"
                                                                    >
                                                                        {getRoleLabel(
                                                                            role
                                                                        )}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>


                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={
                                                                user.isActive &&
                                                                    user.employeeIsActive
                                                                    ? "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200"
                                                                    : "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200"
                                                            }
                                                        >
                                                            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                                                            {user.isActive &&
                                                                user.employeeIsActive
                                                                ? "Con acceso"
                                                                : "Sin acceso"}
                                                        </span>
                                                    </td>


                                                    <td className="whitespace-nowrap px-6 py-4 text-xs tabular-nums text-slate-600">
                                                        {formatDate(
                                                            user.lastLoginAt
                                                        )}
                                                    </td>


                                                    <td className="px-6 py-4">
                                                        <div className="ml-auto grid w-52 grid-cols-2 gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openUsernameForm(
                                                                        user
                                                                    )
                                                                }
                                                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openRolesForm(
                                                                        user
                                                                    )
                                                                }
                                                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                            >
                                                                Roles
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openPasswordForm(
                                                                        user
                                                                    )
                                                                }
                                                                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                            >
                                                                Contraseña
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    void handleChangeStatus(
                                                                        user
                                                                    )
                                                                }
                                                                disabled={
                                                                    changingStatusId ===
                                                                    user.id ||
                                                                    (isOwnUser &&
                                                                        user.isActive) ||
                                                                    (!user.isActive &&
                                                                        !canActivate)
                                                                }
                                                                title={
                                                                    isOwnUser &&
                                                                        user.isActive
                                                                        ? "No puedes desactivar tu propia cuenta."
                                                                        : !user.isActive &&
                                                                            !canActivate
                                                                            ? "El empleado está inactivo."
                                                                            : undefined
                                                                }
                                                                className={
                                                                    user.isActive
                                                                        ? "min-h-11 rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition-colors enabled:hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                                        : "min-h-11 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition-colors enabled:hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
                                                                }
                                                            >
                                                                {changingStatusId ===
                                                                    user.id
                                                                    ? "Guardando..."
                                                                    : user.isActive
                                                                        ? "Desactivar"
                                                                        : "Activar"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
            </section>
        </div>
    );
};
