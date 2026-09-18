import type { InventoryCountItem } from "../../types/types";

export const InventoryCountReviewTable = ({ items }: { items: InventoryCountItem[] }) => (
    <div className="overflow-x-auto focus-visible:outline-sky-600" role="region" aria-label="Cantidades y diferencias del conteo" tabIndex={0}>
        <table className="w-full min-w-140 text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr><th scope="col" className="px-6 py-3">Producto</th><th scope="col" className="px-5 py-3 text-right">Físico</th><th scope="col" className="px-5 py-3 text-right">Sistema</th><th scope="col" className="px-6 py-3 text-right">Variación</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.ppeProductId} className="hover:bg-slate-50">
                <th scope="row" className="px-6 py-4 font-normal"><p className="font-semibold text-slate-900">{item.productName}</p><p className="mt-1 font-mono text-xs text-slate-500">{item.sku}</p><p className="mt-1 text-xs text-slate-500">{item.categoryName}</p></th>
                <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-700">{item.countedQuantity ?? "—"}</td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-600">{item.systemQuantity ?? "—"}</td>
                <td className="px-6 py-4 text-right"><span className={`inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold tabular-nums ${item.variance !== null && item.variance < 0 ? "bg-red-50 text-red-700" : item.variance !== null && item.variance > 0 ? "bg-amber-50 text-amber-800" : "text-slate-500"}`}>
                    {item.variance === null ? "Sin dato" : item.variance === 0 ? "Sin diferencia" : item.variance > 0 ? `+${item.variance}` : item.variance}
                </span></td>
            </tr>)}</tbody>
        </table>
    </div>
);
