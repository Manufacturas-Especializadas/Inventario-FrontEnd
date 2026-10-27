export const getAttentionLevel = (count: number) => {
    if (count === 0) {
        return { label: "Todo al día", accent: "border-l-emerald-500", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-800" };
    }
    if (count <= 5) {
        return { label: "Pendientes por atender", accent: "border-l-amber-500", text: "text-amber-700", badge: "bg-amber-50 text-amber-800" };
    }
    return { label: "Requiere atención", accent: "border-l-red-500", text: "text-red-700", badge: "bg-red-50 text-red-800" };
};
