import { useState } from "react";
import { useUserManagedOrganizationalUnits } from "../../hooks/useUserManagedOrganizationalUnits";
import type { AdminUser } from "../../types/types";
import { CatalogFormModal } from "../catalogs/CatalogFormModal";

interface Props {
    user: AdminUser;
    onClose: () => void;
    onSaved: () => void;
}

export const UserManagedOrganizationalUnitsModal = ({ user, onClose, onSaved }: Props) => {
    const { units, selectedIds, setSelectedIds, loading, saving, loaded, error, reload, save } = useUserManagedOrganizationalUnits(user.id);
    const [search, setSearch] = useState("");
    const hasInactiveSelection = units.some((unit) => !unit.isActive && selectedIds.includes(unit.id));
    const visibleUnits = units.filter((unit) =>
        (unit.isActive || selectedIds.includes(unit.id)) &&
        `${unit.name} ${unit.parentName ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    );

    return (
        <CatalogFormModal id="user-managed-units" title={`Unidades administradas · ${user.employeeName}`}
            description="Selecciona las líneas o áreas cuyos empleados puede atender este encargado. Cada unidad se asigna explícitamente."
            isSubmitting={saving} onClose={onClose}>
            <form className="space-y-4" onSubmit={(event) => {
                event.preventDefault();
                if (!hasInactiveSelection) void save().then((saved) => { if (saved) onSaved(); });
            }}>
                {loading && <p role="status">Cargando unidades...</p>}
                {error && <div role="alert" className="space-y-2 text-sm text-red-700">
                    <p>{error}</p>
                    {!loaded && <button type="button" disabled={loading} onClick={reload} className="rounded-lg border px-3 py-2">Reintentar</button>}
                </div>}
                {loaded && <>
                    <label className="block text-sm font-medium text-slate-700" htmlFor="managed-unit-search">Buscar línea o área</label>
                    <input id="managed-unit-search" value={search} onChange={(event) => setSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3" />
                    <p className="text-sm text-slate-600">{selectedIds.length} unidades seleccionadas. Guardar sin unidades revoca el alcance de solicitudes.</p>
                    {hasInactiveSelection && <p role="alert" className="text-sm text-amber-800">Hay unidades asignadas inactivas. Quítalas de la selección antes de guardar.</p>}
                    <fieldset disabled={saving} className="max-h-80 space-y-2 overflow-y-auto">
                        <legend className="sr-only">Unidades administradas</legend>
                        {visibleUnits.map((unit) => <label key={unit.id} className="flex gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                            <input type="checkbox" checked={selectedIds.includes(unit.id)} onChange={(event) => {
                                setSelectedIds((current) => event.target.checked ? [...current, unit.id] : current.filter((id) => id !== unit.id));
                            }} />
                            <span>{unit.name}{unit.parentName ? ` · ${unit.parentName}` : ""}{!unit.isActive ? " (inactiva)" : ""}</span>
                        </label>)}
                        {visibleUnits.length === 0 && <p className="text-sm text-slate-600">No hay unidades disponibles para esta búsqueda.</p>}
                    </fieldset>
                </>}
                <div className="flex justify-end gap-3">
                    <button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-3 text-sm">Cancelar</button>
                    <button type="submit" disabled={loading || saving || !loaded || hasInactiveSelection}
                        className="rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar unidades"}</button>
                </div>
            </form>
        </CatalogFormModal>
    );
};
