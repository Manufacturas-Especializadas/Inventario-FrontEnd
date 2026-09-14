interface CatalogRowActionsProps {
    isActive: boolean;
    isChanging: boolean;
    disabled: boolean;
    onEdit: () => void;
    onToggleStatus: () => void;
}

export const CatalogRowActions = ({
    isActive,
    isChanging,
    disabled,
    onEdit,
    onToggleStatus,
}: CatalogRowActionsProps) => {
    return (
        <div className="ml-auto grid w-40 grid-cols-1 gap-2 sm:w-72 sm:grid-cols-2">
            <button
                type="button"
                onClick={onEdit}
                disabled={disabled}
                className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors enabled:hover:border-sky-300 enabled:hover:bg-sky-50 enabled:hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
                <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z" /></svg>
                Editar
            </button>

            <button
                type="button"
                onClick={onToggleStatus}
                disabled={disabled}
                className={`inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${isActive
                    ? "border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:border-amber-300 enabled:hover:bg-amber-100 focus-visible:ring-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 enabled:hover:border-emerald-300 enabled:hover:bg-emerald-100 focus-visible:ring-emerald-100"
                    }`}
            >
                {isChanging
                    ? "Guardando..."
                    : isActive
                        ? "Desactivar"
                        : "Activar"}
            </button>
        </div>
    );
};
