import type { ChangeEventHandler } from "react";

interface CatalogStatusFiltersProps {
    searchId: string;
    statusId: string;
    search: string;
    searchPlaceholder: string;
    status: "all" | "active" | "inactive";
    onSearchChange: ChangeEventHandler<HTMLInputElement>;
    onStatusChange: ChangeEventHandler<HTMLSelectElement>;
    showClear: boolean;
    onClear: () => void;
}

export const CatalogStatusFilters = ({
    searchId,
    statusId,
    search,
    searchPlaceholder,
    status,
    onSearchChange,
    onStatusChange,
    showClear,
    onClear,
}: CatalogStatusFiltersProps) => {
    return (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
                <label htmlFor={searchId} className="block text-sm font-medium text-slate-700">
                    Buscar
                </label>

                <input
                    id={searchId}
                    type="search"
                    value={search}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-500 hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none sm:text-sm"
                />
            </div>

            <div className="sm:w-48 sm:shrink-0">
                <label htmlFor={statusId} className="block text-sm font-medium text-slate-700">
                    Estado
                </label>

                <select
                    id={statusId}
                    value={status}
                    onChange={onStatusChange}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-base text-slate-900 outline-none transition-colors hover:border-sky-400 focus:border-sky-600 focus:bg-white focus:ring-4 focus:ring-sky-100 motion-reduce:transition-none sm:text-sm"
                >
                    <option value="all">Todas</option>
                    <option value="active">Activas</option>
                    <option value="inactive">Inactivas</option>
                </select>
            </div>

            {showClear && (
                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={onClear}
                        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 motion-reduce:transition-none sm:w-auto"
                    >
                        Limpiar
                    </button>
                </div>
            )}
        </div>
    );
};
