import {
    Link,
} from "react-router";

import {
    navigationItems,
} from "../config/navigation";

import {
    useAuth,
} from "../hooks/useAuth";

export const DashboardPage = () => {
    const {
        user,
        hasAnyRole,
    } = useAuth();

    const availableModules =
        navigationItems.filter(
            (item) =>
                item.path !== "/" &&
                (
                    !item.roles ||
                    hasAnyRole(
                        item.roles
                    )
                )
        );

    return (
        <div className="mx-auto max-w-7xl">
            <section>
                <p className="text-sm font-medium text-slate-500">
                    Dashboard
                </p>

                <h1 className="mt-1 text-3xl font-bold text-slate-900">
                    Bienvenido, {user?.name}
                </h1>

                <p className="mt-2 text-slate-600">
                    Selecciona uno de los módulos disponibles para comenzar.
                </p>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {availableModules.map(
                    (module) => (
                        <Link
                            key={
                                module.path
                            }
                            to={
                                module.path
                            }
                            className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                        >
                            <h2 className="font-semibold text-slate-900">
                                {module.label}
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Ir al módulo
                            </p>

                            <p className="mt-5 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                Abrir →
                            </p>
                        </Link>
                    )
                )}
            </section>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900">
                    Sesión actual
                </h2>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Usuario
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {user?.username}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Empleado
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {
                                user?.employeeNumber
                            }
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Nombre
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {user?.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Roles
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {user?.roles.join(
                                ", "
                            )}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};