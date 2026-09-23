import type { InventoryCount } from "../../types/types";
import { CatalogLoadingSkeleton } from "../catalogs/CatalogLoadingSkeleton";
import { InventoryCountStatusBadge } from "./InventoryCountStatusBadge";

interface Props {
    counts: InventoryCount[];
    review: boolean;
    loading: boolean;
    hasLoaded: boolean;
    error: string | null;
    onRefresh: () => void;
    onOpen: (count: InventoryCount) => void;
    deletingFolio: string | null;
    deleteError: string | null;
    onDeleteDraft: (count: InventoryCount) => void;
}

export const InventoryCountsList = ({ counts, review, loading, hasLoaded, deletingFolio, deleteError, error, onRefresh, onOpen, onDeleteDraft }: Props) => (
    <div aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
            <div>
                <h2 className="font-semibold text-slate-900">{review ? "Listos para revisar" : "Conteos en curso"}</h2>
                <p className="mt-1 text-sm text-slate-500">{review ? "Revisa las diferencias antes de publicar el ajuste." : "Continúa la captura física de cada almacén."}</p>
            </div>
            <button type="button" onClick={onRefresh} disabled={loading} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50 disabled:opacity-50">
                {loading ? hasLoaded ? "Actualizando..." : "Cargando..." : hasLoaded ? "Actualizar" : "Consultar"}
            </button>
        </div>
        {!review && deleteError && (
            <div
                role="alert"
                className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
                {deleteError}
            </div>
        )}
        {error && <div role="alert" className="mx-5 mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error} {hasLoaded && "Se muestran los últimos datos disponibles."}
            <button type="button" onClick={onRefresh} disabled={loading} className="ml-2 min-h-11 font-semibold underline disabled:opacity-50">Reintentar</button>
        </div>}
        {!hasLoaded && loading && <CatalogLoadingSkeleton label="Cargando conteos..." />}
        {!hasLoaded && !loading && !error && <p className="px-6 py-12 text-center text-sm text-slate-500">Los conteos todavía no se han consultado.</p>}
        {hasLoaded && counts.length === 0 && <div className="px-6 py-14 text-center">
            <p className="font-semibold text-slate-800">{review ? "No hay conteos pendientes de revisión." : "No hay conteos en captura."}</p>
            <p className="mt-2 text-sm text-slate-500">{review ? "Los conteos enviados aparecerán en esta bandeja." : "Usa Nuevo conteo para iniciar el trabajo en un almacén."}</p>
        </div>}
        {hasLoaded && counts.length > 0 && <table className="block w-full text-left text-sm md:table">
            <thead className="hidden border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 md:table-header-group">
                <tr>{["Folio / Almacén", review ? "Diferencias" : "Progreso", review ? "Enviado" : "Iniciado", "Estado", "Acción"].map((label) => <th key={label} scope="col" className="px-6 py-3">{label}</th>)}</tr>
            </thead>
            <tbody className="block divide-y divide-slate-100 md:table-row-group">
                {counts.map((count) => {
                    const captured = count.items.filter((item) => item.countedQuantity !== null).length;
                    const differences = review ? count.items.filter((item) => item.variance !== null && item.variance !== 0).length : 0;
                    const date = review ? count.submittedAt : count.createdAt;
                    return <tr key={count.folio} className="grid grid-cols-2 gap-3 p-5 hover:bg-sky-50/40 md:table-row md:p-0">
                        <th scope="row" className="col-span-2 min-w-0 font-normal md:px-6 md:py-5">
                            <p className="break-all font-mono font-semibold text-sky-900">{count.folio}</p>
                            <p className="mt-1 text-slate-600">{count.warehouseCode} · {count.warehouseName}</p>
                        </th>
                        <td className="md:px-6 md:py-5">
                            {review ? <span className={`font-semibold ${differences ? "text-amber-800" : "text-slate-600"}`}>{differences} con diferencias</span> : <>
                                <p className="font-semibold tabular-nums text-slate-700">{captured} / {count.items.length} <span className="font-normal text-slate-500">capturados</span></p>
                                <progress aria-label={`Progreso ${count.folio}`} className="mt-2 h-1.5 w-full max-w-40 accent-sky-600" value={captured} max={count.items.length || 1} />
                            </>}
                        </td>
                        <td className="text-slate-500 md:px-6 md:py-5"><span className="mr-1 md:hidden">{review ? "Enviado:" : "Inicio:"}</span>{date ? new Date(date).toLocaleDateString("es-MX") : "—"}</td>
                        <td className="self-center md:px-6 md:py-5"><InventoryCountStatusBadge status={count.status} /></td>
                        <td className="text-right md:px-6 md:py-5">
                            <div className="flex flex-wrap justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        onOpen(count)
                                    }
                                    disabled={
                                        deletingFolio ===
                                        count.folio
                                    }
                                    aria-label={`${review ? "Revisar" : "Continuar"} ${count.folio}`}
                                    className="min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2 font-semibold text-sky-800 hover:bg-sky-50 focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {review
                                        ? "Revisar"
                                        : "Continuar"}
                                </button>

                                {!review && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onDeleteDraft(
                                                count
                                            )
                                        }
                                        disabled={
                                            deletingFolio !== null
                                        }
                                        aria-label={`Eliminar ${count.folio}`}
                                        className="min-h-11 rounded-xl border border-red-200 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {deletingFolio ===
                                            count.folio
                                            ? "Eliminando..."
                                            : "Eliminar"}
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>;
                })}
            </tbody>
        </table>}
    </div>
);
