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
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Dashboard
                </p>

                <h1 className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Bienvenido, {user?.name}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Selecciona uno de los módulos disponibles para comenzar.
                </p>
            </section>

            <section aria-labelledby="dashboard-modules-heading">
                <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-700 shadow-sm">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                    </span>
                    <div>
                        <h2 id="dashboard-modules-heading" className="text-lg font-semibold tracking-tight text-slate-900">Módulos disponibles</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Accede a las herramientas de tu operación diaria.</p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {availableModules.map(
                    (module) => (
                        <Link
                            key={
                                module.path
                            }
                            to={
                                module.path
                            }
                            className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
                        >
                            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-sky-100 transition-colors group-hover:bg-sky-500 group-focus-visible:bg-sky-500 motion-reduce:transition-none" />
                            <h3 className="wrap-break-word text-base font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-sky-800 motion-reduce:transition-none">
                                {module.label}
                            </h3>

                            <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
                                Ir al módulo
                            </p>

                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm font-semibold text-sky-800">
                                <span>Abrir módulo</span>
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 transition-colors group-hover:bg-sky-700 group-hover:text-white group-focus-visible:bg-sky-700 group-focus-visible:text-white motion-reduce:transition-none">
                                    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14m-6-6 6 6-6 6" />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    )
                )}
                </div>
            </section>

            <section aria-labelledby="dashboard-session-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)]">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5 sm:px-8">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                        </svg>
                    </span>
                    <h2 id="dashboard-session-heading" className="text-lg font-semibold tracking-tight text-slate-900">
                        Sesión actual
                    </h2>
                </div>

                <dl className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 xl:grid-cols-4 [&>div]:min-w-0 [&>div]:rounded-xl [&>div]:border [&>div]:border-slate-100 [&>div]:bg-slate-50/70 [&>div]:p-4">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Usuario
                        </dt>

                        <dd className="mt-2 wrap-break-word text-sm font-medium leading-6 text-slate-900">
                            {user?.username}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Empleado
                        </dt>

                        <dd className="mt-2 wrap-break-word font-mono text-sm font-medium leading-6 text-slate-900">
                            {
                                user?.employeeNumber
                            }
                        </dd>
                    </div>

                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Nombre
                        </dt>

                        <dd className="mt-2 wrap-break-word text-sm font-medium leading-6 text-slate-900">
                            {user?.name}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Roles
                        </dt>

                        <dd className="mt-2 wrap-break-word text-sm font-medium leading-6 text-sky-800">
                            {user?.roles.join(
                                ", "
                            )}
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    );
};
