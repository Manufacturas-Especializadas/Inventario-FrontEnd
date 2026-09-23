import { useEffect, useState } from "react";
import { useInventoryCounts } from "../hooks/useInventoryCounts";
import { useWarehouses } from "../hooks/useWarehouses";
import { useAuth } from "../hooks/useAuth";
import { PageHeader } from "../components/ui/PageHeader";
import { InventoryCountsList } from "../components/inventoryCounts/InventoryCountsList";
import { StartInventoryCountModal } from "../components/inventoryCounts/StartInventoryCountModal";
import { InventoryCountWorkspace } from "../components/inventoryCounts/InventoryCountWorkspace";

export const InventoryCountsPage = () => {
    const counts = useInventoryCounts();
    const { getDrafts } = counts;
    const warehouses = useWarehouses({ autoLoad: false });
    const { hasRole } = useAuth();
    const isAdministrator = hasRole("Administrator");
    const [tab, setTab] = useState<"drafts" | "review">("drafts");
    const [showStart, setShowStart] = useState(false);
    const [searchFolio, setSearchFolio] = useState("");

    useEffect(() => { void getDrafts(); }, [getDrafts]);

    const selectTab = (next: "drafts" | "review") => {
        if (next === "review" && !isAdministrator) return;
        setTab(next);
        if (next === "review" && !counts.hasLoadedPendingReview) void counts.getPendingReview();
    };
    const openStart = () => {
        counts.clearCount();
        setShowStart(true);
        if (!warehouses.hasLoaded) void warehouses.refresh();
    };
    const review = tab === "review" && isAdministrator;

    const handleDeleteDraft = async (
        count: typeof counts.draftCounts[number]
    ) => {
        const capturedItems =
            count.items.filter(
                (item) =>
                    item.countedQuantity !== null
            ).length;

        const warning =
            capturedItems > 0
                ? `El conteo ${count.folio} tiene ${capturedItems} producto(s) capturado(s).\n\nSi lo eliminas, el conteo y las cantidades capturadas se borrarán permanentemente.`
                : `¿Eliminar el conteo ${count.folio}?\n\nEl borrador se eliminará permanentemente.`;

        if (!window.confirm(warning)) {
            return;
        }

        await counts.deleteDraft(
            count.folio
        );
    };

    return <div className="mx-auto max-w-7xl space-y-6">
        {counts.inventoryCount ? <InventoryCountWorkspace
            key={counts.inventoryCount.folio}
            count={counts.inventoryCount}
            operations={counts}
            isAdministrator={isAdministrator}
            onBack={counts.clearCount}
        /> : <>
            <PageHeader eyebrow="MESA · Inventario" title="Conteos físicos" description="Captura, revisa y publica conteos físicos de inventario." />
            <div className="flex flex-col gap-4 sm:flex-row-reverse sm:items-end sm:justify-between">
                <button type="button" onClick={openStart} aria-controls="start-count-modal" className="min-h-12 shrink-0 rounded-xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200">+ Nuevo conteo</button>
                <form onSubmit={(event) => { event.preventDefault(); void counts.getByFolio(searchFolio); }} className="w-full sm:max-w-lg">
                    <label htmlFor="count-folio" className="text-sm font-medium text-slate-700">Abrir por folio</label>
                    <div className="mt-2 flex gap-2">
                        <input id="count-folio" value={searchFolio} onChange={(event) => setSearchFolio(event.target.value)} placeholder="Escribe el folio del conteo" className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-base focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100" />
                        <button type="submit" className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-sky-50">{counts.loading ? "Abriendo..." : "Abrir"}</button>
                    </div>
                    {counts.loading && <button type="button" onClick={counts.clearCount} className="mt-1 min-h-11 text-sm text-sky-800 underline">Cancelar búsqueda</button>}
                </form>
            </div>
            {!showStart && counts.error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{counts.error}</p>}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div role="tablist" aria-label="Bandejas de conteos" className="flex border-b border-slate-200 bg-slate-50/50 p-2"
                    onKeyDown={(event) => {
                        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                        event.preventDefault();
                        const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]"));
                        const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
                        const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
                        tabs[next]?.focus();
                        tabs[next]?.click();
                    }}>
                    <button type="button" role="tab" id="counts-drafts-tab" aria-controls="counts-queue" aria-selected={!review} tabIndex={!review ? 0 : -1} onClick={() => selectTab("drafts")} className={`min-h-12 flex-1 rounded-xl px-3 py-2 text-sm font-semibold sm:flex-none sm:px-5 ${!review ? "bg-white text-sky-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
                        En captura {counts.hasLoadedDrafts ? `(${counts.draftCounts.length})` : ""}
                    </button>
                    {isAdministrator && <button type="button" role="tab" id="counts-review-tab" aria-controls="counts-queue" aria-selected={review} tabIndex={review ? 0 : -1} onClick={() => selectTab("review")} className={`min-h-12 flex-1 rounded-xl px-3 py-2 text-sm font-semibold sm:flex-none sm:px-5 ${review ? "bg-white text-sky-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"}`}>
                        Pendientes de revisión {counts.hasLoadedPendingReview ? `(${counts.pendingReviewCounts.length})` : ""}
                    </button>}
                </div>
                <div id="counts-queue" role="tabpanel" aria-labelledby={review ? "counts-review-tab" : "counts-drafts-tab"} tabIndex={0} className="focus-visible:outline-sky-600">
                    <InventoryCountsList review={review} counts={review ? counts.pendingReviewCounts : counts.draftCounts}
                        loading={review ? counts.loadingPendingReview : counts.loadingDrafts}
                        hasLoaded={review ? counts.hasLoadedPendingReview : counts.hasLoadedDrafts}
                        error={review ? counts.reviewError : counts.draftsError}
                        onRefresh={() => { void (review ? counts.getPendingReview() : counts.getDrafts()); }}
                        onOpen={counts.openCount}
                        deletingFolio={counts.deletingFolio}
                        deleteError={counts.deleteError}
                        onDeleteDraft={handleDeleteDraft} />
                </div>
            </section>
        </>}
        {showStart && !counts.inventoryCount && <StartInventoryCountModal catalog={warehouses} error={counts.error} onStart={counts.startCount} onClose={() => setShowStart(false)} />}
    </div>;
};
