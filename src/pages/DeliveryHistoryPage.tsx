import { useState, type FormEvent } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { DeliveryHistoryDetail } from "../components/ppe-requests/DeliveryHistoryDetail";
import { CatalogFormModal } from "../components/catalogs/CatalogFormModal";
import { useDeliveryHistory } from "../hooks/useDeliveryHistory";
import { useWarehouses } from "../hooks/useWarehouses";
import { useOrganizationalUnits } from "../hooks/useOrganizationalUnits";
import { getRequestReasonLabel } from "../utils/requestReasonLabels";
import { getRequestStatusConfig } from "../utils/ppeRequestStatus";

const localDate = (offsetDays = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatDateTime = (value: string): string => new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

interface HistoryFilters {
    deliveredFrom: string;
    deliveredTo: string;
    employeeNumber: string;
    search: string;
    warehouseId: string;
    requestedForOrganizationalUnitId: string;
}

const inputClassName = "mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60";
const buttonClassName = "min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50";

export const DeliveryHistoryPage = () => {
    const { page, loading, error, getHistory, clearHistory, selectedFolio, detail, loadingDetail, detailError, getDetail, closeDetail } = useDeliveryHistory();
    const { warehouses, loading: loadingWarehouses, error: warehousesError, refresh: refreshWarehouses } = useWarehouses();
    const { organizationalUnits, loading: loadingUnits, error: unitsError, refresh: refreshUnits } = useOrganizationalUnits();
    const [filters, setFilters] = useState<HistoryFilters>(() => {
        const today = localDate();
        return { deliveredFrom: today, deliveredTo: today, employeeNumber: "", search: "", warehouseId: "", requestedForOrganizationalUnitId: "" };
    });

    const invalidDateRange = Boolean(filters.deliveredFrom && filters.deliveredTo && filters.deliveredFrom > filters.deliveredTo);
    const canQuery = Boolean(filters.deliveredFrom && filters.deliveredTo && !invalidDateRange);

    const updateFilter = (field: keyof HistoryFilters, value: string) => {
        setFilters((current) => ({ ...current, [field]: value }));
        // Changed filters invalidate both the page and any older list/detail responses.
        clearHistory();
    };

    const setDateRange = (offsetDays: number) => {
        const date = localDate(offsetDays);
        setFilters((current) => ({ ...current, deliveredFrom: date, deliveredTo: date }));
        clearHistory();
    };

    const queryPage = (pageNumber = 1) => {
        if (!canQuery || loading || pageNumber < 1) return;
        if (pageNumber > 1 && (!page || pageNumber > page.totalPages)) return;
        void getHistory({
            deliveredFrom: filters.deliveredFrom,
            deliveredTo: filters.deliveredTo,
            employeeNumber: filters.employeeNumber.trim() || undefined,
            search: filters.search.trim() || undefined,
            warehouseId: filters.warehouseId ? Number(filters.warehouseId) : undefined,
            requestedForOrganizationalUnitId: filters.requestedForOrganizationalUnitId ? Number(filters.requestedForOrganizationalUnitId) : undefined,
            pageNumber,
            pageSize: 25,
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        queryPage();
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <PageHeader eyebrow="MESA · Almacén" title="Historial de entregas de EPP" description="Consulta las entregas realizadas por fecha, empleado, unidad destino y almacén." />

            <form onSubmit={handleSubmit} aria-label="Filtros del historial" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">Filtros de consulta</h2>
                    <div className="flex gap-2" role="group" aria-label="Accesos rápidos de fecha">
                        <button type="button" onClick={() => setDateRange(0)} className={buttonClassName}>Hoy</button>
                        <button type="button" onClick={() => setDateRange(-1)} className={buttonClassName}>Ayer</button>
                    </div>
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0">
                    <div>
                        <label htmlFor="delivery-history-from" className="text-sm font-medium text-slate-700">Desde</label>
                        <input id="delivery-history-from" type="date" required value={filters.deliveredFrom} onChange={(event) => updateFilter("deliveredFrom", event.target.value)} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? "delivery-history-date-error" : undefined} className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="delivery-history-to" className="text-sm font-medium text-slate-700">Hasta</label>
                        <input id="delivery-history-to" type="date" required value={filters.deliveredTo} onChange={(event) => updateFilter("deliveredTo", event.target.value)} aria-invalid={invalidDateRange} aria-describedby={invalidDateRange ? "delivery-history-date-error" : undefined} className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="delivery-history-employee" className="text-sm font-medium text-slate-700">Número de nómina</label>
                        <input id="delivery-history-employee" type="text" autoComplete="off" placeholder="Nómina exacta" value={filters.employeeNumber} onChange={(event) => updateFilter("employeeNumber", event.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="delivery-history-search" className="text-sm font-medium text-slate-700">Folio o nombre del empleado</label>
                        <input id="delivery-history-search" type="search" placeholder="Buscar por folio o nombre" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} className={inputClassName} />
                    </div>
                    <div>
                        <label htmlFor="delivery-history-unit" className="text-sm font-medium text-slate-700">Unidad destino / línea</label>
                        <select id="delivery-history-unit" value={filters.requestedForOrganizationalUnitId} disabled={loadingUnits} onChange={(event) => updateFilter("requestedForOrganizationalUnitId", event.target.value)} className={inputClassName}>
                            <option value="">{loadingUnits ? "Cargando unidades..." : "Todas las unidades"}</option>
                            {organizationalUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.parentName ? ` / ${unit.parentName}` : ""}{!unit.isActive ? " (inactiva)" : ""}</option>)}
                        </select>
                        {unitsError && <div role="alert" className="mt-2 text-sm text-red-700"><p>{unitsError}</p><button type="button" disabled={loadingUnits} onClick={() => void refreshUnits()} className={`${buttonClassName} mt-2`}>Reintentar unidades</button></div>}
                    </div>
                    <div>
                        <label htmlFor="delivery-history-warehouse" className="text-sm font-medium text-slate-700">Almacén</label>
                        <select id="delivery-history-warehouse" value={filters.warehouseId} disabled={loadingWarehouses} onChange={(event) => updateFilter("warehouseId", event.target.value)} className={inputClassName}>
                            <option value="">{loadingWarehouses ? "Cargando almacenes..." : "Todos los almacenes"}</option>
                            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} — {warehouse.name}{!warehouse.isActive ? " (inactivo)" : ""}</option>)}
                        </select>
                        {warehousesError && <div role="alert" className="mt-2 text-sm text-red-700"><p>{warehousesError}</p><button type="button" disabled={loadingWarehouses} onClick={() => void refreshWarehouses()} className={`${buttonClassName} mt-2`}>Reintentar almacenes</button></div>}
                    </div>
                </div>
                {invalidDateRange && <p id="delivery-history-date-error" role="alert" className="mt-4 text-sm text-red-700">La fecha Desde no puede ser posterior a Hasta.</p>}
                <div className="mt-5 flex justify-end">
                    <button type="submit" disabled={!canQuery || loading} className="min-h-11 w-full rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{loading ? "Consultando..." : "Consultar"}</button>
                </div>
            </form>

            <section aria-labelledby="delivery-history-results" aria-busy={loading} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
                <h2 id="delivery-history-results" className="text-lg font-semibold tracking-tight text-slate-900">Entregas realizadas</h2>
                {!page && !loading && !error && <p className="mt-4 text-sm text-slate-500">Selecciona los filtros y pulsa Consultar. El rango inicial corresponde a las entregas de hoy.</p>}
                {loading && <p role="status" className="mt-4 text-sm text-slate-500">Cargando historial de entregas...</p>}
                {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                {page && !loading && (
                    <>
                        <p className="mt-4 text-sm font-medium text-slate-600">Mostrando {page.items.length} de {page.totalCount} entregas</p>
                        {page.items.length === 0 && <p role="status" className="mt-5 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-6 text-sm text-slate-600">No hay entregas para los filtros seleccionados.</p>}
                        <div className="mt-5 space-y-4">
                            {page.items.map((entry) => {
                                const status = getRequestStatusConfig(entry.status);
                                return (
                                    <article key={entry.id} className="min-w-0 rounded-2xl border border-sky-200 p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="wrap-break-word font-mono text-sm font-semibold text-sky-900">{entry.folio}</h3>
                                                <p className="mt-1 text-sm text-slate-500">Entregada: <time dateTime={entry.deliveredAt}>{formatDateTime(entry.deliveredAt)}</time></p>
                                            </div>
                                            <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                                        </div>
                                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4 [&>div]:min-w-0 [&_dd]:mt-1 [&_dd]:wrap-break-word [&_dd]:text-slate-800 [&_dt]:text-xs [&_dt]:text-slate-500">
                                            <div><dt>Empleado</dt><dd>{entry.employeeName}</dd></div>
                                            <div><dt>Nómina</dt><dd>{entry.employeeNumber}</dd></div>
                                            <div><dt>Unidad destino / línea</dt><dd>{entry.requestedForOrganizationalUnitName ?? "Sin unidad asignada"}</dd></div>
                                            <div><dt>Almacén</dt><dd>{entry.warehouseName}</dd></div>
                                            <div><dt>Motivo</dt><dd>{getRequestReasonLabel(entry.requestReason, entry.requestReasonCode)}</dd></div>
                                            <div><dt>Artículos</dt><dd>{entry.itemCount}</dd></div>
                                            <div><dt>Entregada por</dt><dd>{entry.deliveredByUserName ?? "No registrado"}</dd></div>
                                        </dl>
                                        <button type="button" aria-haspopup="dialog" aria-controls="delivery-history-detail" onClick={() => void getDetail(entry.folio)} className={`${buttonClassName} mt-4`}>
                                            Ver detalle
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                        <nav aria-label="Paginación del historial" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                            <button type="button" disabled={!page.hasPreviousPage || page.pageNumber <= 1} onClick={() => queryPage(page.pageNumber - 1)} className={buttonClassName}>Anterior</button>
                            <p className="text-sm text-slate-600">Página {page.pageNumber} de {Math.max(1, page.totalPages)}</p>
                            <button type="button" disabled={!page.hasNextPage || page.pageNumber >= page.totalPages} onClick={() => queryPage(page.pageNumber + 1)} className={buttonClassName}>Siguiente</button>
                        </nav>
                    </>
                )}
            </section>
            {selectedFolio && (
                <CatalogFormModal
                    id="delivery-history-detail"
                    title="Detalle de entrega"
                    description={selectedFolio}
                    isSubmitting={false}
                    onClose={closeDetail}
                    closeLabel="Cerrar detalle de entrega"
                    closeOnBackdrop
                    wide
                    footer={<button type="button" onClick={closeDetail} className={buttonClassName}>Cerrar</button>}
                >
                    <div aria-busy={loadingDetail}>
                        {loadingDetail && <p role="status" className="text-sm text-slate-500">Cargando detalle de la entrega...</p>}
                        {detailError && <div role="alert" className="text-sm text-red-700"><p>{detailError}</p><button type="button" onClick={() => void getDetail(selectedFolio)} className={`${buttonClassName} mt-3`}>Reintentar detalle</button></div>}
                        {detail && <DeliveryHistoryDetail request={detail} formatDateTime={formatDateTime} />}
                    </div>
                </CatalogFormModal>
            )}
        </div>
    );
};
