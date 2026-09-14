interface ActiveStatusBadgeProps {
    isActive: boolean;
}

export const ActiveStatusBadge = ({ isActive }: ActiveStatusBadgeProps) => {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${isActive
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
        >
            {isActive ? "Activo" : "Inactivo"}
        </span>
    );
};
