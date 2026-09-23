import { useRef, useState, type FormEvent } from "react";
import type { useWarehouses } from "../../hooks/useWarehouses";
import type { InventoryCount, StartInventoryCountRequest } from "../../types/types";
import { CatalogFormModal } from "../catalogs/CatalogFormModal";

interface Props {
    catalog: ReturnType<typeof useWarehouses>;
    error: string | null;
    onStart: (request: StartInventoryCountRequest) => Promise<InventoryCount | null>;
    onClose: () => void;
}

export const StartInventoryCountModal = ({ catalog, error, onStart, onClose }: Props) => {
    const [warehouseId, setWarehouseId] = useState("");
    const [notes, setNotes] = useState("");
    const [starting, setStarting] = useState(false);
    const pending = useRef(false);
    const activeWarehouses = catalog.warehouses.filter((warehouse) => warehouse.isActive);
    const ready = catalog.hasLoaded && !catalog.loading && !catalog.error;
    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (pending.current || !ready || !activeWarehouses.some((warehouse) => warehouse.id === Number(warehouseId))) return;
        pending.current = true;
        setStarting(true);
        try {
            const result = await onStart({ warehouseId: Number(warehouseId), notes: notes.trim() || null });
            if (result) onClose();
        } finally {
            pending.current = false;
            setStarting(false);
        }
    };
    return <CatalogFormModal id="start-count-modal" title="Nuevo conteo físico" description="Selecciona el almacén. La captura no mostrará las existencias del sistema." isSubmitting={starting} onClose={() => { if (!pending.current) onClose(); }}>
        <form onSubmit={submit} className="mt-6 space-y-5">
            {catalog.loading && <p role="status" className="text-sm text-sky-800">Cargando almacenes...</p>}
            {catalog.error && <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{catalog.error} <button type="button" disabled={catalog.loading} onClick={() => void catalog.refresh()} className="min-h-11 font-semibold underline">Reintentar almacenes</button></div>}
            {ready && activeWarehouses.length === 0 && <p className="text-sm text-slate-600">No hay almacenes activos disponibles.</p>}
            <fieldset disabled={starting || !ready} className="space-y-5">
                <div><label htmlFor="count-warehouse" className="text-sm font-medium text-slate-700">Almacén *</label>
                    <select id="count-warehouse" required value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base focus:ring-4 focus:ring-sky-100">
                        <option value="">Selecciona un almacén</option>
                        {activeWarehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
                    </select>
                </div>
                <div><label htmlFor="count-notes" className="text-sm font-medium text-slate-700">Notas <span className="font-normal text-slate-400">(opcional)</span></label>
                    <textarea id="count-notes" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:ring-4 focus:ring-sky-100" />
                </div>
            </fieldset>
            {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" disabled={starting} onClick={() => { if (!pending.current) onClose(); }} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 disabled:opacity-50">Cancelar</button>
                <button disabled={starting || !ready || !warehouseId} className="min-h-11 rounded-xl bg-sky-700 px-5 py-2 font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{starting ? "Iniciando..." : "Iniciar conteo"}</button>
            </div>
        </form>
    </CatalogFormModal>;
};
