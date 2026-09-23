import type { InventoryCountItem } from "../../types/types";

interface Props {
    items: InventoryCountItem[];
    values: Record<number, string>;
    savingProductIds: Set<number>;
    submitting: boolean;
    onChange: (id: number, value: string) => void;
    onSave: (item: InventoryCountItem) => void;
}

// This component deliberately renders no systemQuantity or variance, even if the DTO contains them.
export const InventoryCountCaptureList = ({ items, values, savingProductIds, submitting, onChange, onSave }: Props) => (
    <ul className="divide-y divide-slate-100">
        {items.map((item) => {
            const value = values[item.ppeProductId] ?? (item.countedQuantity === null ? "" : String(item.countedQuantity));
            const valid = value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;
            const saved = valid && item.countedQuantity !== null && Number(value) === item.countedQuantity;
            const saving = savingProductIds.has(item.ppeProductId);
            return <li key={item.ppeProductId} className="p-5 sm:px-6">
                <form onSubmit={(event) => { event.preventDefault(); if (valid && !saved && !saving && !submitting) onSave(item); }} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem] md:items-center">
                    <div className="min-w-0">
                        <p className="break-words font-semibold text-slate-900">{item.productName}</p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-500">{item.sku}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.categoryName}</p>
                    </div>
                    <div>
                        <label htmlFor={`count-quantity-${item.ppeProductId}`} className="text-xs font-medium text-slate-600">Cantidad física · {item.sku}</label>
                        <div className="mt-2 flex items-center gap-3">
                            <input id={`count-quantity-${item.ppeProductId}`} type="number" inputMode="numeric" min="0" step="1" value={value}
                                disabled={saving || submitting} onChange={(event) => onChange(item.ppeProductId, event.target.value)}
                                aria-invalid={value !== "" && !valid} aria-describedby={`count-save-${item.ppeProductId}`}
                                className="min-h-12 w-24 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-lg font-semibold tabular-nums text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50" />
                            <button type="submit" disabled={!valid || saved || saving || submitting} className="min-h-12 min-w-28 rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:bg-slate-100 disabled:text-slate-500">
                                {saving ? "Guardando..." : saved ? "Guardado" : item.countedQuantity !== null ? "Guardar cambios" : "Guardar"}
                            </button>
                        </div>
                        <p id={`count-save-${item.ppeProductId}`} className={`mt-2 text-xs ${saved ? "text-emerald-700" : "text-slate-500"}`}>
                            {saved ? "✓ Cantidad guardada" : !valid && value !== "" ? "Ingresa un entero igual o mayor a cero." : item.countedQuantity !== null ? "Cambios sin guardar" : "Pendiente de captura"}
                        </p>
                    </div>
                </form>
            </li>;
        })}
    </ul>
);
