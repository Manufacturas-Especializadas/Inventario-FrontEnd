import type { InventoryCountStatus } from "../../types/types";

const statuses = {
    1: { label: "En captura", color: "bg-sky-50 text-sky-800 ring-sky-200" },
    2: { label: "Pendiente de revisión", color: "bg-amber-50 text-amber-800 ring-amber-200" },
    3: { label: "Publicado", color: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
    4: { label: "Cancelado", color: "bg-slate-100 text-slate-700 ring-slate-200" },
};

export const InventoryCountStatusBadge = ({ status }: { status: InventoryCountStatus }) => (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statuses[status]?.color ?? "bg-slate-100 text-slate-700"}`}>
        {statuses[status]?.label ?? "Desconocido"}
    </span>
);
