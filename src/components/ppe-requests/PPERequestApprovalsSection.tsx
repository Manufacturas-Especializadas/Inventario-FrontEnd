import { useState, type FormEvent } from "react";
import { usePPERequestApprovals } from "../../hooks/usePPERequestApprovals";
import { getRequestStatusConfig } from "../../utils/ppeRequestStatus";
import { getRequestReasonLabel } from "../../utils/requestReasonLabels";

const formatDateTime = (value: string) => new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));

const buttonClassName = "min-h-11 rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition-colors enabled:hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-50";
const primaryClassName = "min-h-11 rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors enabled:hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50";

export const PPERequestApprovalsSection = () => {
    const {
        pendingApprovalRequests, loaded, loading, error, needsPageLoad,
        pageNumber, totalCount, totalPages, hasPreviousPage, hasNextPage,
        approvingFolio, rejectingFolio, approveError, rejectError,
        getPendingApproval, approveRequest, rejectRequest, clearMutationErrors,
    } = usePPERequestApprovals();
    const [action, setAction] = useState<{ folio: string; kind: "approve" | "reject" } | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const mutating = approvingFolio !== null || rejectingFolio !== null;

    const openAction = (folio: string, kind: "approve" | "reject") => {
        if (mutating) return;
        clearMutationErrors();
        setSuccessMessage(null);
        setRejectionReason("");
        setAction({ folio, kind });
    };

    const closeAction = () => {
        if (mutating) return;
        setAction(null);
        setRejectionReason("");
        clearMutationErrors();
    };

    const loadPage = (target: number) => {
        if (mutating) return;
        closeAction();
        void getPendingApproval(target);
    };

    const confirmAction = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!action || mutating) return;
        if (action.kind === "approve") {
            const result = await approveRequest(action.folio);
            if (!result) return;
            setSuccessMessage(`Solicitud ${result.folio} aprobada. Estado: ${getRequestStatusConfig(result.status).label}. Puedes actualizar las entregas para consultarla.`);
        } else {
            const result = await rejectRequest(action.folio, rejectionReason);
            if (!result) return;
            setSuccessMessage(`Solicitud ${result.folio}: ${getRequestStatusConfig(result.status).label}.`);
        }
        setAction(null);
        setRejectionReason("");
    };

    return (
        <section aria-labelledby="ppe-approvals-title" aria-busy={loading || mutating} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(12,74,110,0.15)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 id="ppe-approvals-title" className="text-lg font-semibold tracking-tight text-slate-900">Solicitudes especiales por autorizar</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Revisa solicitudes por daño, pérdida u otro motivo excepcional antes de liberar inventario.</p>
                </div>
                <button type="button" onClick={() => loadPage(pageNumber)} disabled={loading || mutating} className={`${buttonClassName} shrink-0`}>
                    {loading ? "Consultando..." : loaded ? "Actualizar" : "Consultar solicitudes"}
                </button>
            </div>

            {successMessage && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{successMessage}</p>}
            {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
            {loading && <p role="status" className="mt-5 text-sm text-slate-500">Cargando solicitudes por autorizar...</p>}
            {loaded && <p className="mt-5 text-sm font-medium text-slate-600">Pendientes de autorización: {totalCount}</p>}
            {loaded && !loading && !error && pendingApprovalRequests.length === 0 && (
                <p role="status" className="mt-5 rounded-xl border border-dashed border-sky-200 bg-sky-50/50 p-6 text-sm text-slate-600">
                    {needsPageLoad ? "Hay solicitudes pendientes. Pulsa Actualizar para consultar esta página." : "No hay solicitudes especiales pendientes de autorización."}
                </p>
            )}

            <div className="mt-5 space-y-5">
                {pendingApprovalRequests.map((request) => {
                    const status = getRequestStatusConfig(request.status);
                    const selectedAction = action?.folio === request.folio ? action : null;
                    return (
                        <article key={request.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="wrap-break-word font-mono text-base font-semibold text-slate-900">{request.folio}</h3>
                                    <p className="mt-1 text-xs text-slate-500"><time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></p>
                                </div>
                                <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                            </div>
                            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 [&>div]:min-w-0 [&_dd]:wrap-break-word">
                                <div><dt className="text-slate-500">Empleado</dt><dd className="mt-1 font-medium text-slate-900">{request.employeeName}</dd></div>
                                <div><dt className="text-slate-500">Número de nómina</dt><dd className="mt-1 text-slate-800">{request.employeeNumber}</dd></div>
                                <div><dt className="text-slate-500">Unidad organizacional destino</dt><dd className="mt-1 text-slate-800">{request.requestedForOrganizationalUnitName ?? "Sin unidad asignada"}</dd></div>
                                <div><dt className="text-slate-500">Almacén</dt><dd className="mt-1 text-slate-800">{request.warehouseName}</dd></div>
                                <div><dt className="text-slate-500">Motivo</dt><dd className="mt-1 font-medium text-slate-900">{getRequestReasonLabel(request.requestReason, request.requestReasonCode)}</dd></div>
                            </dl>
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm font-semibold text-amber-900">Justificación de la solicitud</p>
                                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-amber-900">{request.notes || "Sin notas registradas."}</p>
                            </div>
                            <ul aria-label="Productos solicitados" className="mt-4 space-y-2">
                                {request.items.map((item) => (
                                    <li key={item.ppeProductId} className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 wrap-break-word"><p className="text-sm font-medium text-slate-800">{item.productName}</p><p className="text-xs text-slate-500">{item.sku}</p></div>
                                        <p className="shrink-0 text-sm font-semibold text-slate-700">Cantidad: {item.quantity}</p>
                                    </li>
                                ))}
                            </ul>

                            {!selectedAction ? (
                                <div className="mt-5 flex flex-wrap justify-end gap-3">
                                    <button type="button" onClick={() => openAction(request.folio, "reject")} disabled={mutating} className={buttonClassName}>Rechazar</button>
                                    <button type="button" onClick={() => openAction(request.folio, "approve")} disabled={mutating} className={primaryClassName}>Aprobar</button>
                                </div>
                            ) : (
                                <form onSubmit={(event) => void confirmAction(event)} aria-label={`${selectedAction.kind === "approve" ? "Aprobar" : "Rechazar"} solicitud ${request.folio}`} className="mt-5 rounded-xl border border-sky-200 bg-sky-50/70 p-5">
                                    <h4 className="text-sm font-semibold text-sky-900">{selectedAction.kind === "approve" ? "Confirmar aprobación" : "Confirmar rechazo"}</h4>
                                    {selectedAction.kind === "approve" ? (
                                        <p className="mt-2 text-sm leading-6 text-sky-900">Al aprobar, el sistema volverá a validar la existencia disponible y reservará el EPP para entrega.</p>
                                    ) : (
                                        <div className="mt-4">
                                            <label htmlFor={`rejection-reason-${request.id}`} className="block text-sm font-medium text-slate-700">Motivo del rechazo</label>
                                            <textarea id={`rejection-reason-${request.id}`} required maxLength={500} rows={4} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} disabled={mutating} autoFocus aria-describedby={`rejection-count-${request.id}`} className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-sky-600 focus:ring-4 focus:ring-sky-100 disabled:opacity-60" />
                                            <p id={`rejection-count-${request.id}`} className="mt-2 text-xs text-slate-500">{rejectionReason.length}/500 caracteres.</p>
                                        </div>
                                    )}
                                    {(selectedAction.kind === "approve" ? approveError : rejectError) && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">{selectedAction.kind === "approve" ? approveError : rejectError}</p>}
                                    <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button type="button" onClick={closeAction} disabled={mutating} className={buttonClassName}>Volver</button>
                                        <button type="submit" autoFocus={selectedAction.kind === "approve"} disabled={mutating || (selectedAction.kind === "reject" && (!rejectionReason.trim() || rejectionReason.length > 500))} className={primaryClassName}>
                                            {selectedAction.kind === "approve" ? approvingFolio === request.folio ? "Aprobando..." : "Confirmar aprobación" : rejectingFolio === request.folio ? "Rechazando..." : "Confirmar rechazo"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </article>
                    );
                })}
            </div>

            {loaded && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                    <button type="button" disabled={!hasPreviousPage || loading || mutating} onClick={() => loadPage(pageNumber - 1)} className={buttonClassName}>Anterior</button>
                    <p className="text-sm text-slate-600">Página {pageNumber} de {Math.max(1, totalPages)}</p>
                    <button type="button" disabled={!hasNextPage || loading || mutating} onClick={() => loadPage(pageNumber + 1)} className={buttonClassName}>Siguiente</button>
                </div>
            )}
        </section>
    );
};
