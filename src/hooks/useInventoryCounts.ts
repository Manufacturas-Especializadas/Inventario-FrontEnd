import { useCallback, useRef, useState } from "react";
import { inventoryCountsService } from "../api/services/InventoryCountsService";
import type { InventoryCount, InventoryCountItem, StartInventoryCountRequest } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

type ListChange = (counts: InventoryCount[]) => InventoryCount[];
type CountChange = (count: InventoryCount) => InventoryCount;

const upsertCount = (counts: InventoryCount[], count: InventoryCount) =>
    [count, ...counts.filter((entry) => entry.folio !== count.folio)];

export const useInventoryCounts = () => {
    const [inventoryCount, setInventoryCount] = useState<InventoryCount | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savingProductIds, setSavingProductIds] = useState<Set<number>>(() => new Set());
    const [submitting, setSubmitting] = useState(false);
    const [postingFolio, setPostingFolio] = useState<string | null>(null);
    const [postError, setPostError] = useState<string | null>(null);
    const [deletingFolio, setDeletingFolio] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [cancellingFolio, setCancellingFolio] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [draftCounts, setDraftCounts] = useState<InventoryCount[]>([]);
    const [hasLoadedDrafts, setHasLoadedDrafts] = useState(false);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [draftsError, setDraftsError] = useState<string | null>(null);
    const [pendingReviewCounts, setPendingReviewCounts] = useState<InventoryCount[]>([]);
    const [hasLoadedPendingReview, setHasLoadedPendingReview] = useState(false);
    const [loadingPendingReview, setLoadingPendingReview] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    const viewVersion = useRef(0);
    const draftsRequest = useRef<Promise<InventoryCount[]> | null>(null);
    const reviewRequest = useRef<Promise<InventoryCount[]> | null>(null);
    const detailRequests = useRef(new Map<string, Promise<InventoryCount>>());
    const startRequest = useRef<Promise<InventoryCount | null> | null>(null);
    const submitRequest = useRef<Promise<InventoryCount | null> | null>(null);
    const postRequest = useRef<{ folio: string; promise: Promise<InventoryCount | null> } | null>(null);
    const captureRequests = useRef(new Map<string, Promise<InventoryCountItem | null>>());
    const reviewLoaded = useRef(false);
    const deleteRequest = useRef<{ folio: string; promise: Promise<boolean>; } | null>(null);
    const cancelRequest = useRef<{ folio: string; promise: Promise<InventoryCount | null>; } | null>(null);
    // Replay mutations completed during a GET so its older snapshot cannot undo them.
    const draftChanges = useRef<ListChange[]>([]);
    const reviewChanges = useRef<ListChange[]>([]);
    const detailChanges = useRef(new Map<string, CountChange[]>());

    const updateDrafts = useCallback((change: ListChange) => {
        if (draftsRequest.current) draftChanges.current.push(change);
        setDraftCounts(change);
    }, []);

    const updateReview = useCallback((change: ListChange) => {
        if (reviewRequest.current) reviewChanges.current.push(change);
        if (reviewLoaded.current) setPendingReviewCounts(change);
    }, []);

    const updateCount = useCallback((folio: string, change: CountChange) => {
        detailChanges.current.get(folio)?.push(change);
        setInventoryCount((current) => current?.folio === folio ? change(current) : current);
    }, []);

    const getDrafts = useCallback(() => {
        if (draftsRequest.current) return draftsRequest.current;
        setLoadingDrafts(true);
        setDraftsError(null);
        draftChanges.current = [];
        const request = (async () => {
            try {
                const data = await inventoryCountsService.getDrafts();
                const merged = draftChanges.current.reduce((counts, change) => change(counts), data);
                setDraftCounts(merged);
                setHasLoadedDrafts(true);
                return merged;
            } catch (error) {
                setDraftsError(getApiErrorMessage(error, "No fue posible consultar los conteos en curso."));
                return [];
            } finally {
                setLoadingDrafts(false);
                draftsRequest.current = null;
                draftChanges.current = [];
            }
        })();
        draftsRequest.current = request;
        return request;
    }, []);

    const getPendingReview = useCallback(() => {
        if (reviewRequest.current) return reviewRequest.current;
        setLoadingPendingReview(true);
        setReviewError(null);
        reviewChanges.current = [];
        const request = (async () => {
            try {
                const data = await inventoryCountsService.getPendingReview();
                const merged = reviewChanges.current.reduce((counts, change) => change(counts), data);
                setPendingReviewCounts(merged);
                reviewLoaded.current = true;
                setHasLoadedPendingReview(true);
                return merged;
            } catch (error) {
                setReviewError(getApiErrorMessage(error, "No fue posible consultar los conteos pendientes de revisión."));
                return [];
            } finally {
                setLoadingPendingReview(false);
                reviewRequest.current = null;
                reviewChanges.current = [];
            }
        })();
        reviewRequest.current = request;
        return request;
    }, []);

    const getByFolio = useCallback(async (folio: string): Promise<InventoryCount | null> => {
        const key = folio.trim();
        const version = ++viewVersion.current;
        if (!key) {
            setLoading(false);
            setError("Ingresa un folio de conteo.");
            return null;
        }
        setLoading(true);
        setError(null);
        try {
            let request = detailRequests.current.get(key);
            if (!request) {
                detailChanges.current.set(key, []);
                request = inventoryCountsService.getByFolio(key).then((data) =>
                    (detailChanges.current.get(key) ?? []).reduce((count, change) => change(count), data)
                ).finally(() => {
                    detailRequests.current.delete(key);
                    detailChanges.current.delete(key);
                });
                detailRequests.current.set(key, request);
            }
            const data = await request;
            if (version !== viewVersion.current) return null;
            setInventoryCount(data);
            return data;
        } catch (error) {
            if (version === viewVersion.current) {
                setInventoryCount(null);
                setError(getApiErrorMessage(error, "No fue posible consultar el conteo físico."));
            }
            return null;
        } finally {
            if (version === viewVersion.current) setLoading(false);
        }
    }, []);

    const startCount = useCallback((payload: StartInventoryCountRequest) => {
        if (startRequest.current) return startRequest.current;
        const version = ++viewVersion.current;
        setLoading(true);
        setError(null);
        const request = (async () => {
            try {
                const data = await inventoryCountsService.start(payload);
                updateDrafts((counts) => upsertCount(counts, data));
                if (version !== viewVersion.current) return null;
                setInventoryCount(data);
                return data;
            } catch (error) {
                if (version === viewVersion.current) setError(getApiErrorMessage(error, "No fue posible iniciar el conteo físico."));
                return null;
            } finally {
                startRequest.current = null;
                if (version === viewVersion.current) setLoading(false);
            }
        })();
        startRequest.current = request;
        return request;
    }, [updateDrafts]);

    const captureItem = useCallback((folio: string, ppeProductId: number, countedQuantity: number) => {
        const key = JSON.stringify([folio, ppeProductId]);
        const pending = captureRequests.current.get(key);
        if (pending) return pending;
        if (submitRequest.current || postRequest.current?.folio === folio) return Promise.resolve(null);
        if (!Number.isInteger(countedQuantity) || countedQuantity < 0) {
            setError("La cantidad contada debe ser un número entero igual o mayor a cero.");
            return Promise.resolve(null);
        }
        const version = viewVersion.current;
        setSavingProductIds((current) => new Set(current).add(ppeProductId));
        setError(null);
        const request = (async () => {
            try {
                const data = await inventoryCountsService.captureItem(folio, ppeProductId, { countedQuantity });
                const change: CountChange = (count) => ({
                    ...count,
                    items: count.items.map((item) => item.ppeProductId === data.ppeProductId ? data : item),
                });
                updateCount(folio, change);
                updateDrafts((counts) => counts.map((count) => count.folio === folio ? change(count) : count));
                return version === viewVersion.current ? data : null;
            } catch (error) {
                if (version === viewVersion.current) setError(getApiErrorMessage(error, "No fue posible guardar la cantidad contada."));
                return null;
            } finally {
                captureRequests.current.delete(key);
                setSavingProductIds((current) => {
                    const next = new Set(current);
                    next.delete(ppeProductId);
                    return next;
                });
            }
        })();
        captureRequests.current.set(key, request);
        return request;
    }, [updateCount, updateDrafts]);

    const submitCount = useCallback((folio: string) => {
        if (submitRequest.current) return submitRequest.current;
        if (captureRequests.current.size > 0) return Promise.resolve(null);
        const version = viewVersion.current;
        setSubmitting(true);
        setError(null);
        const request = (async () => {
            try {
                const data = await inventoryCountsService.submit(folio);
                updateCount(data.folio, () => data);
                updateDrafts((counts) => counts.filter((count) => count.folio !== data.folio));
                if (data.status === 2) updateReview((counts) => upsertCount(counts, data));
                return version === viewVersion.current ? data : null;
            } catch (error) {
                if (version === viewVersion.current) setError(getApiErrorMessage(error, "No fue posible enviar el conteo a revisión."));
                return null;
            } finally {
                submitRequest.current = null;
                setSubmitting(false);
            }
        })();
        submitRequest.current = request;
        return request;
    }, [updateCount, updateDrafts, updateReview]);

    const postCount = useCallback((folio: string) => {

        if (
            cancelRequest.current?.folio === folio
        ) {
            return Promise.resolve(null);
        }

        if (postRequest.current) {
            return postRequest.current.folio === folio ? postRequest.current.promise : Promise.resolve(null);
        }
        setPostingFolio(folio);
        setPostError(null);
        const request = (async () => {
            try {
                const data = await inventoryCountsService.post(folio);
                updateReview((counts) => counts.filter((count) => count.folio !== data.folio));
                updateCount(data.folio, () => data);
                return data;
            } catch (error) {
                setPostError(getApiErrorMessage(error, "No fue posible publicar el conteo físico."));
                return null;
            } finally {
                postRequest.current = null;
                setPostingFolio(null);
            }
        })();
        postRequest.current = { folio, promise: request };
        return request;
    }, [updateCount, updateReview]);

    const clearCount = useCallback(() => {
        viewVersion.current += 1;
        setInventoryCount(null);
        setLoading(false);
        setError(null);
    }, []);

    const openCount = useCallback((count: InventoryCount) => {
        viewVersion.current += 1;
        setInventoryCount(count);
        setLoading(false);
        setError(null);
    }, []);

    const deleteDraft = useCallback(
        (folio: string) => {
            const key =
                folio
                    .trim()
                    .toUpperCase();

            if (deleteRequest.current) {
                return deleteRequest.current.folio === key
                    ? deleteRequest.current.promise
                    : Promise.resolve(false);
            }

            if (
                submitRequest.current ||
                postRequest.current?.folio === key
            ) {
                return Promise.resolve(false);
            }

            setDeletingFolio(key);
            setDeleteError(null);

            const request = (async () => {
                try {
                    await inventoryCountsService
                        .deleteDraft(key);

                    updateDrafts((counts) =>
                        counts.filter(
                            (count) =>
                                count.folio !== key
                        )
                    );

                    // Si justamente estaba abierto,
                    // ya no debe permanecer en pantalla.
                    setInventoryCount((current) =>
                        current?.folio === key
                            ? null
                            : current
                    );

                    return true;
                } catch (error) {
                    setDeleteError(
                        getApiErrorMessage(
                            error,
                            "No fue posible eliminar el conteo en curso."
                        )
                    );

                    return false;
                } finally {
                    deleteRequest.current = null;
                    setDeletingFolio(null);
                }
            })();

            deleteRequest.current = {
                folio: key,
                promise: request,
            };

            return request;
        },
        [updateDrafts]
    );

    const cancelCount = useCallback(
        (
            folio: string,
            reason: string
        ) => {
            const key =
                folio
                    .trim()
                    .toUpperCase();

            const trimmedReason =
                reason.trim();

            if (!trimmedReason) {
                setCancelError(
                    "Ingresa el motivo de cancelación."
                );

                return Promise.resolve(null);
            }

            if (trimmedReason.length > 500) {
                setCancelError(
                    "El motivo de cancelación no puede superar los 500 caracteres."
                );

                return Promise.resolve(null);
            }

            if (cancelRequest.current) {
                return cancelRequest.current.folio === key
                    ? cancelRequest.current.promise
                    : Promise.resolve(null);
            }

            if (
                postRequest.current?.folio === key
            ) {
                return Promise.resolve(null);
            }

            setCancellingFolio(key);
            setCancelError(null);

            const request = (async () => {
                try {
                    const data =
                        await inventoryCountsService
                            .cancel(
                                key,
                                {
                                    reason:
                                        trimmedReason,
                                }
                            );

                    // Ya no pertenece a pendientes.
                    updateReview((counts) =>
                        counts.filter(
                            (count) =>
                                count.folio !==
                                data.folio
                        )
                    );

                    // Si está abierto, convertirlo
                    // inmediatamente a Cancelled.
                    updateCount(
                        data.folio,
                        () => data
                    );

                    return data;
                } catch (error) {
                    setCancelError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cancelar el conteo físico."
                        )
                    );

                    return null;
                } finally {
                    cancelRequest.current = null;
                    setCancellingFolio(null);
                }
            })();

            cancelRequest.current = {
                folio: key,
                promise: request,
            };

            return request;
        },
        [
            updateCount,
            updateReview,
        ]
    );

    return {
        inventoryCount, loading, error, savingProductIds, submitting, postingFolio, postError,
        draftCounts, hasLoadedDrafts, loadingDrafts, draftsError, getDrafts,
        pendingReviewCounts, hasLoadedPendingReview, loadingPendingReview, reviewError, getPendingReview,
        getByFolio, startCount, captureItem, submitCount, postCount, clearCount, openCount,
        deletingFolio, deleteError, deleteDraft, cancelCount, cancelError, cancellingFolio,
    };
};
