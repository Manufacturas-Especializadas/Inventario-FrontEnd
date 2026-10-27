import {
    Link,
} from "react-router";

import {
    useAuth,
} from "../hooks/useAuth";

import { navigationItems } from "../config/navigation";
import { getRecentModules } from "../utils/recentModules";
import { DashboardAttention } from "../components/dashboard/DashboardAttention";
import { isProductionOnly } from "../utils/userRoles";

export const DashboardPage = () => {
    const {
        user,
        hasAnyRole,
    } = useAuth();

    if (user && isProductionOnly(user.roles)) {
        return (
            <div className="mx-auto max-w-7xl space-y-6">
                <section className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">MESA · Inicio</p>
                    <h1 className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Hola, {user.name}</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Desde aquí puedes solicitar el equipo de protección personal necesario para tu área.</p>
                    <Link to="/ppe-requests?action=new" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2">Solicitar EPP</Link>
                </section>
                <section aria-label="Datos del solicitante" className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <dl className="grid gap-5 text-sm sm:grid-cols-3 [&>div]:min-w-0 [&_dd]:wrap-break-word">
                        <div><dt className="text-slate-500">Nombre</dt><dd className="mt-1 font-medium text-slate-900">{user.name}</dd></div>
                        <div><dt className="text-slate-500">Número de nómina</dt><dd className="mt-1 font-medium text-slate-900">{user.employeeNumber}</dd></div>
                        <div><dt className="text-slate-500">Unidad organizacional</dt><dd className="mt-1 font-medium text-slate-900">{user.organizationalUnitName ?? "Sin unidad asignada"}</dd></div>
                    </dl>
                </section>
            </div>
        );
    }

    const recentModules = user
        ? getRecentModules(user.userId).flatMap((recent) => {
            const item = navigationItems.find((item) => item.path === recent.path && item.path !== "/");
            return item && (!item.roles || hasAnyRole(item.roles)) ? [item] : [];
        })
        : [];

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            <section className="relative isolate overflow-hidden rounded-3xl border border-sky-200 bg-linear-to-br from-white via-sky-50 to-sky-100 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border-32 border-white/50" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    MESA · Inicio
                </p>

                <h1 className="mt-3 wrap-break-word text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                    Bienvenido, {user?.name}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Consulta tus actividades pendientes y continúa trabajando en tus módulos recientes.
                </p>
            </section>

            {hasAnyRole(["Administrator", "Warehouse"]) && (
                <DashboardAttention key={user?.userId + ":" + user?.roles.join(",")} isAdministrator={hasAnyRole(["Administrator"])} />
            )}

            {recentModules.length > 0 && (
                <section aria-labelledby="dashboard-recent-heading">
                    <div className="mb-5">
                        <h2 id="dashboard-recent-heading" className="text-lg font-semibold tracking-tight text-slate-900">Continuar trabajando</h2>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Vuelve rápidamente a los módulos que utilizaste recientemente.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {recentModules.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="group flex min-w-0 flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 motion-reduce:transition-none"
                            >
                                <h3 className="wrap-break-word text-sm font-semibold text-slate-900 group-hover:text-sky-800">{item.label}</h3>
                                <span className="flex items-center justify-between gap-3 text-sm font-semibold text-sky-800">
                                    Continuar
                                    <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14m-6-6 6 6-6 6" />
                                    </svg>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}


        </div>
    );
};
