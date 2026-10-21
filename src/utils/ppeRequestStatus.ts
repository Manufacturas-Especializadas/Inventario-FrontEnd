export const getRequestStatusConfig = (status: number) => {
    switch (status) {
        case 1:
            return { label: "Pendiente", className: "bg-amber-50 text-amber-700" };
        case 2:
            return { label: "Entregada", className: "bg-emerald-50 text-emerald-700" };
        case 3:
            return { label: "Cancelada", className: "bg-red-50 text-red-700" };
        case 4:
            return { label: "Pendiente de autorización", className: "bg-amber-50 text-amber-700" };
        case 5:
            return { label: "Rechazada", className: "bg-red-50 text-red-700" };
        default:
            return { label: "Desconocido", className: "bg-slate-100 text-slate-600" };
    }
};
