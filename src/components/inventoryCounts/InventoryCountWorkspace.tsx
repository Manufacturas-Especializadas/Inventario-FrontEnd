import { useEffect, useMemo, useRef, useState } from "react";
import type { InventoryCount, InventoryCountItem } from "../../types/types";
import type { useInventoryCounts } from "../../hooks/useInventoryCounts";
import { CatalogFormModal } from "../catalogs/CatalogFormModal";
import { InventoryCountStatusBadge } from "./InventoryCountStatusBadge";
import { InventoryCountCaptureList } from "./InventoryCountCaptureList";
import { InventoryCountReviewTable } from "./InventoryCountReviewTable";

interface Props {
    count: InventoryCount;
    operations: ReturnType<typeof useInventoryCounts>;
    isAdministrator: boolean;
    onBack: () => void;
}

export const InventoryCountWorkspace = ({ count, operations, isAdministrator, onBack }: Props) => {
    const {
        savingProductIds,
        submitting,
        postingFolio,
        cancellingFolio,
        error,
        postError,
        cancelError,
        captureItem,
        submitCount,
        postCount,
        cancelCount,
    } = operations;

    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelAttempted, setCancelAttempted] = useState(false);
    const [values, setValues] = useState<Record<number, string>>({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [success, setSuccess] = useState<string | null>(null);
    const [confirmPost, setConfirmPost] = useState(false);
    const [postAttempted, setPostAttempted] = useState(false);
    const mutationPending = useRef(false);
    const titleRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => { titleRef.current?.focus(); }, []);
    const draft = count.status === 1;

    const busy =
        submitting ||
        postingFolio !== null ||
        cancellingFolio !== null ||
        savingProductIds.size > 0;

    const captured = count.items.filter((item) => item.countedQuantity !== null).length;
    // Do not even derive differences while in blind capture.
    const differences = draft ? 0 : count.items.filter((item) => item.variance !== null && item.variance !== 0).length;
    const noDifferences = draft ? 0 : count.items.filter((item) => item.variance === 0).length;
    const unsaved = draft && count.items.some((item) => {
        const value = values[item.ppeProductId];
        return value !== undefined && (value.trim() === "" ? item.countedQuantity !== null : Number(value) !== item.countedQuantity);
    });

    const canSubmit = draft && count.items.length > 0 && captured === count.items.length && !busy && !unsaved;
    const visibleItems = useMemo(() => {
        const text = search.trim().toLocaleLowerCase("es");
        return count.items.filter((item) => [item.sku, item.productName, item.categoryName].some((value) => value.toLocaleLowerCase("es").includes(text)) &&
            (filter === "all" || (draft
                ? filter === "pending" ? item.countedQuantity === null : item.countedQuantity !== null
                : filter === "differences" ? item.variance !== null && item.variance !== 0 : item.variance === 0)));
    }, [count.items, search, filter, draft]);

    const save = async (item: InventoryCountItem) => {
        const value = values[item.ppeProductId];
        if (!draft || value === undefined || value.trim() === "" || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) === item.countedQuantity) return;
        setSuccess(null);
        await captureItem(count.folio, item.ppeProductId, Number(value));
    };

    const submit = async () => {
        if (!canSubmit || mutationPending.current) return;
        mutationPending.current = true;
        setSuccess(null);
        try {
            if (await submitCount(count.folio)) {
                setFilter("all");
                setSuccess(`Conteo ${count.folio} enviado a revisión correctamente.`);
            }
        } finally { mutationPending.current = false; }
    };

    const publish = async () => {
        if (
            !isAdministrator ||
            count.status !== 2 ||
            mutationPending.current
        ) {
            return;
        }

        mutationPending.current = true;
        setPostAttempted(true);

        try {
            if (await postCount(count.folio)) {
                setConfirmPost(false);

                setSuccess(
                    `Conteo ${count.folio} publicado correctamente. El inventario fue ajustado.`
                );
            }
        } finally {
            mutationPending.current = false;
        }
    };

    const cancel = async () => {
        const reason =
            cancelReason.trim();

        if (
            !isAdministrator ||
            count.status !== 2 ||
            !reason ||
            mutationPending.current
        ) {
            return;
        }

        mutationPending.current = true;
        setCancelAttempted(true);

        try {
            const result =
                await cancelCount(
                    count.folio,
                    reason
                );

            if (result) {
                setConfirmCancel(false);
                setCancelReason("");

                setSuccess(
                    `Conteo ${count.folio} cancelado correctamente.`
                );
            }
        } finally {
            mutationPending.current = false;
        }
    };

    return <div className="space-y-5">
        <button type="button" disabled={busy} onClick={() => { if (!mutationPending.current) onBack(); }} className="min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-50">← Volver a conteos</button>
        <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-widest text-sky-700">Conteo físico</p>
                    <h1 ref={titleRef} tabIndex={-1} className="mt-2 break-all text-2xl font-semibold tracking-tight text-slate-900 focus:outline-none sm:text-3xl">{count.folio}</h1>
                    <p className="mt-2 text-slate-600">{count.warehouseCode} · {count.warehouseName}</p>
                </div>
                <InventoryCountStatusBadge status={count.status} />
            </div>
            <p className="mt-3 text-xs text-slate-500">
                Iniciado:{" "}
                {new Date(
                    count.createdAt
                ).toLocaleString("es-MX")}

                {count.submittedAt &&
                    ` · Enviado: ${new Date(
                        count.submittedAt
                    ).toLocaleString("es-MX")}`}

                {count.postedAt &&
                    ` · Publicado: ${new Date(
                        count.postedAt
                    ).toLocaleString("es-MX")}`}

                {count.cancelledAt &&
                    ` · Cancelado: ${new Date(
                        count.cancelledAt
                    ).toLocaleString("es-MX")}`}
            </p>
            {count.notes && <p className="mt-4 whitespace-pre-wrap wrap-break-word border-l-2 border-sky-200 pl-3 text-sm text-slate-600">{count.notes}</p>}
            {count.status === 4 &&
                count.cancellationReason && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                            Motivo de cancelación
                        </p>

                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-red-800">
                            {count.cancellationReason}
                        </p>
                    </div>
                )}
            {draft ? <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="flex flex-wrap justify-between gap-2 text-sm"><p className="font-semibold text-slate-800">{captured} de {count.items.length} productos capturados</p><span className="text-slate-500">{count.items.length ? Math.round(captured / count.items.length * 100) : 0}%</span></div>
                <progress aria-label="Progreso de captura" value={captured} max={count.items.length || 1} className="mt-3 h-2 w-full accent-sky-600" />
                <p className="mt-3 text-xs text-slate-500">Conteo ciego · Registra la cantidad física y guarda cada producto.</p>
            </div> : <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-5 text-sm">
                <div><dt className="text-slate-500">Productos</dt><dd className="mt-1 text-xl font-semibold text-slate-900">{count.items.length}</dd></div>
                <div><dt className="text-slate-500">Con diferencias</dt><dd className="mt-1 text-xl font-semibold text-amber-800">{differences}</dd></div>
                <div><dt className="text-slate-500">Sin diferencias</dt><dd className="mt-1 text-xl font-semibold text-slate-700">{noDifferences}</dd></div>
            </dl>}
        </section>
        {success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{success}</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="space-y-4 border-b border-slate-100 p-5 sm:px-6">
                <label htmlFor="count-product-search" className="block text-sm font-medium text-slate-700">Buscar producto
                    <input id="count-product-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="SKU, nombre o categoría" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
                </label>
                <div role="group" aria-label="Filtrar productos" className="flex flex-wrap gap-2">
                    {(draft ? [["all", "Todos"], ["pending", "Pendientes"], ["captured", "Capturados"]] : [["all", "Todos"], ["differences", "Con diferencias"], ["equal", "Sin diferencias"]]).map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold ${filter === value ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{label}</button>)}
                </div>
            </div>
            {visibleItems.length === 0 ? <p className="px-6 py-12 text-center text-sm text-slate-500">{count.items.length ? "No hay productos para estos filtros." : "Este conteo no contiene productos."}</p> : draft
                ? <InventoryCountCaptureList items={visibleItems} values={values} savingProductIds={savingProductIds} submitting={submitting} onChange={(id, value) => setValues((current) => ({ ...current, [id]: value }))} onSave={(item) => void save(item)} />
                : <InventoryCountReviewTable items={visibleItems} />}
        </section>
        {draft && <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sky-900">{unsaved ? "Guarda los cambios pendientes antes de enviar." : captured === count.items.length && count.items.length > 0 ? "Captura completa. Puedes enviar el conteo a revisión." : "Guarda la cantidad de todos los productos para continuar."}</p>
            <button type="button" disabled={!canSubmit} onClick={() => void submit()} className="min-h-12 shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{submitting ? "Enviando..." : "Enviar a revisión"}</button>
        </div>}
        {count.status === 2 && (
            <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">
                    {isAdministrator
                        ? "Revisa las diferencias. Puedes cancelar el conteo o publicar el ajuste."
                        : "Pendiente de publicación por un Administrator. Este conteo es de solo lectura."}
                </p>

                {isAdministrator && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            aria-controls="cancel-count-modal"
                            disabled={busy}
                            onClick={() => {
                                setCancelAttempted(false);
                                setCancelReason("");
                                setConfirmCancel(true);
                            }}
                            className="min-h-12 shrink-0 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancelar conteo
                        </button>

                        <button
                            type="button"
                            aria-controls="post-count-modal"
                            disabled={busy}
                            onClick={() => {
                                setPostAttempted(false);
                                setConfirmPost(true);
                            }}
                            className="min-h-12 shrink-0 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            Publicar ajuste
                        </button>
                    </div>
                )}
            </div>
        )}

        {confirmCancel &&
            count.status === 2 &&
            isAdministrator && (
                <CatalogFormModal
                    id="cancel-count-modal"
                    title={`Cancelar ${count.folio}`}
                    description="El conteo se conservará para trazabilidad, pero dejará de estar pendiente de revisión. Esta acción no modifica el inventario."
                    isSubmitting={
                        cancellingFolio !== null
                    }
                    onClose={() => {
                        if (
                            !mutationPending.current
                        ) {
                            setConfirmCancel(false);
                            setCancelReason("");
                            setCancelAttempted(false);
                        }
                    }}
                >
                    <div className="mt-5">
                        <label
                            htmlFor="cancel-count-reason"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Motivo de cancelación
                        </label>

                        <textarea
                            id="cancel-count-reason"
                            value={cancelReason}
                            onChange={(event) =>
                                setCancelReason(
                                    event.target.value
                                )
                            }
                            disabled={
                                cancellingFolio !== null
                            }
                            maxLength={500}
                            rows={4}
                            placeholder="Explica por qué se cancela este conteo..."
                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:bg-slate-100"
                        />

                        <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
                            <span>Obligatorio</span>

                            <span>
                                {cancelReason.length}/500
                            </span>
                        </div>
                    </div>

                    {cancelAttempted &&
                        cancelError && (
                            <p
                                role="alert"
                                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {cancelError}
                            </p>
                        )}

                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <button
                            type="button"
                            disabled={
                                cancellingFolio !== null
                            }
                            onClick={() => {
                                setConfirmCancel(false);
                                setCancelReason("");
                                setCancelAttempted(false);
                            }}
                            className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600 disabled:opacity-50"
                        >
                            Volver
                        </button>

                        <button
                            type="button"
                            disabled={
                                cancellingFolio !== null ||
                                !cancelReason.trim()
                            }
                            onClick={() =>
                                void cancel()
                            }
                            className="min-h-11 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {cancellingFolio !== null
                                ? "Cancelando..."
                                : "Cancelar conteo"}
                        </button>
                    </div>
                </CatalogFormModal>
            )}

        {confirmPost && count.status === 2 && isAdministrator && <CatalogFormModal id="post-count-modal" title={`Publicar ${count.folio}`} description="Las diferencias modificarán el inventario actual del almacén. Esta acción publica el conteo y finaliza su revisión." isSubmitting={postingFolio !== null} onClose={() => { if (!mutationPending.current) setConfirmPost(false); }}>
            <p className="mt-5 text-sm text-slate-700">{count.warehouseName} · {differences} productos con diferencias.</p>
            {postAttempted && postError && <p role="alert" className="mt-4 text-sm text-red-700">{postError}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button type="button" disabled={postingFolio !== null} onClick={() => setConfirmPost(false)} className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600">Cancelar</button>
                <button type="button" disabled={postingFolio !== null} onClick={() => void publish()} className="min-h-11 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50">{postingFolio ? "Publicando..." : "Confirmar publicación"}</button>
            </div>
        </CatalogFormModal>}
    </div>;
};
