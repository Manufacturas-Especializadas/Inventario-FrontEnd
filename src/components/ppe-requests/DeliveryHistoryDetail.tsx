import type { PPERequest } from "../../types/types";
import { getRequestReasonLabel } from "../../utils/requestReasonLabels";

interface DeliveryHistoryDetailProps {
    request: PPERequest;
    formatDateTime: (value: string) => string;
}

export const DeliveryHistoryDetail = ({ request, formatDateTime }: DeliveryHistoryDetailProps) => (
    <div className="space-y-5">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3 [&>div]:min-w-0 [&_dd]:mt-1 [&_dd]:wrap-break-word [&_dd]:text-slate-900 [&_dt]:text-slate-500">
            <div><dt>Empleado</dt><dd>{request.employeeName}</dd></div>
            <div><dt>Número de nómina</dt><dd>{request.employeeNumber}</dd></div>
            <div><dt>Unidad destino / línea</dt><dd>{request.requestedForOrganizationalUnitName ?? "Sin unidad asignada"}</dd></div>
            <div><dt>Almacén</dt><dd>{request.warehouseName}</dd></div>
            <div><dt>Motivo</dt><dd>{getRequestReasonLabel(request.requestReason, request.requestReasonCode)}</dd></div>
            <div><dt>Fecha de solicitud</dt><dd><time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></dd></div>
            <div><dt>Fecha de entrega</dt><dd>{request.deliveredAt ? <time dateTime={request.deliveredAt}>{formatDateTime(request.deliveredAt)}</time> : "No registrada"}</dd></div>
            <div><dt>Entregada por</dt><dd>{request.deliveredByUserName ?? "No registrado"}</dd></div>
        </dl>
        {request.approvedAt && request.approvedByUserName && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <h3 className="font-semibold">Autorización excepcional</h3>
                <p className="mt-1 wrap-break-word">Autorizó: {request.approvedByUserName}</p>
                <time className="mt-1 block" dateTime={request.approvedAt}>{formatDateTime(request.approvedAt)}</time>
            </div>
        )}
        {request.notes?.trim() && (
            <div className="rounded-xl border border-sky-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-700">Observaciones / Justificación</h3>
                <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">{request.notes}</p>
            </div>
        )}
        <div>
            <h3 className="text-sm font-semibold text-sky-900">Artículos entregados</h3>
            <ul className="mt-3 space-y-2">
                {request.items.map((item) => (
                    <li key={item.ppeProductId} className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 wrap-break-word"><p className="text-sm font-medium text-slate-900">{item.productName}</p><p className="mt-1 text-xs text-slate-500">SKU: {item.sku}</p></div>
                        <div className="text-sm text-slate-700 sm:text-right">
                            <p className="font-semibold">{item.quantity} {item.stockUnitSymbol || item.stockUnitName || "(unidad no registrada)"}</p>
                        </div>
                    </li>
                ))}
            </ul>
            {request.items.length === 0 && <p className="mt-3 text-sm text-slate-500">No hay artículos registrados en esta entrega.</p>}
        </div>
    </div>
);
