import { Link } from "react-router";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";
import { getAttentionLevel } from "../../utils/dashboardAttention";

export const DashboardAttention = ({ isAdministrator }: { isAdministrator: boolean }) => {
    const { summary, loading, error } = useDashboardSummary();
    const cards = [
        ...(isAdministrator ? [{
            title: "Solicitudes por autorizar",
            description: "Solicitudes excepcionales que necesitan revisión.",
            count: summary?.pendingApprovals,
            path: "/deliveries",
            icon: "M9 12l2 2 4-4M9 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-3M9 2h6v4H9z",
        }] : []),
        {
            title: "Entregas pendientes",
            description: "Solicitudes listas para entrega en Almacén.",
            count: summary?.pendingDeliveries,
            path: "/deliveries",
            icon: "M3 7l9-4 9 4v10l-9 4-9-4V7zm0 0l9 4 9-4M12 11v10M7 5l10 4",
        },
    ];

    return (
        <section aria-labelledby="dashboard-attention-heading" aria-busy={loading}>
            <div className="mb-5">
                <h2 id="dashboard-attention-heading" className="text-lg font-semibold tracking-tight text-slate-900">Atención requerida</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Revisa las actividades que requieren seguimiento según tus permisos.</p>
            </div>
            {error ? (
                <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">{error}</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {cards.map((card) => {
                        const level = !loading && card.count != null ? getAttentionLevel(card.count) : null;
                        return (
                            <Link key={card.title} to={card.path}
                                className={`group flex min-w-0 flex-col rounded-2xl border border-l-4 border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 focus-visible:ring-offset-2 motion-reduce:transition-none ${level?.accent ?? "border-l-slate-300"}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                                    <svg aria-hidden="true" className={`h-6 w-6 shrink-0 ${level?.text ?? "text-slate-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={card.icon} /></svg>
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
                                <div className="my-6 flex min-h-14 items-center" aria-live="polite">
                                    {loading ? <span className="text-sm text-slate-500">Cargando...</span> :
                                        level ? <span className={`text-5xl font-semibold tabular-nums tracking-tight ${level.text}`}>{card.count}</span> :
                                            <span className="text-sm text-slate-500">No disponible</span>}
                                </div>
                                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                                    {level && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${level.badge}`}>{level.label}</span>}
                                    <span className="ml-auto inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-sky-800">Ver <span aria-hidden="true">→</span></span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
};
