import { useCallback, useEffect, useRef, useState } from "react";
import { ppeRequestsService } from "../api/services/PPERequestsService";
import type {
    ApprovePPERequestResult,
    PagedResult,
    PendingApprovalPPERequest,
    RejectPPERequestResult,
} from "../types/types";
import { getApiErrorMessage } from "../utils/utils";
import { useAuth } from "./useAuth";

const pageSize = 25;
const initialPage: PagedResult<PendingApprovalPPERequest> = {
    items: [], pageNumber: 1, pageSize,
    totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false,
};

export const usePPERequestApprovals = () => {
    const { hasRole } = useAuth();
    const [page, setPage] = useState(initialPage);
    const pageRef = useRef(initialPage);
    const [loaded, setLoaded] = useState(false);
    const loadedRef = useRef(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsPageLoad, setNeedsPageLoad] = useState(false);
    const version = useRef(0);
    const pendingLoad = useRef<{ pageNumber: number; promise: Promise<PendingApprovalPPERequest[]> } | null>(null);
    const resolvedFolios = useRef(new Set<string>());
    const mounted = useRef(true);

    const [approvingFolio, setApprovingFolio] = useState<string | null>(null);
    const [rejectingFolio, setRejectingFolio] = useState<string | null>(null);
    const [approveError, setApproveError] = useState<string | null>(null);
    const [rejectError, setRejectError] = useState<string | null>(null);
    // A synchronous lock also blocks an approve/reject race on the same folio.
    const mutationInFlight = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const updatePage = useCallback((next: PagedResult<PendingApprovalPPERequest>) => {
        pageRef.current = next;
        setPage(next);
    }, []);

    const getPendingApproval = useCallback((pageNumber = 1): Promise<PendingApprovalPPERequest[]> => {
        if (!hasRole("Administrator") || !mounted.current || mutationInFlight.current) return Promise.resolve([]);
        const lastPage = loadedRef.current ? Math.max(1, pageRef.current.totalPages) : 1;
        if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > lastPage) return Promise.resolve([]);
        if (pendingLoad.current?.pageNumber === pageNumber) return pendingLoad.current.promise;

        const requestVersion = ++version.current;
        setLoading(true);
        setError(null);
        const promise = (async () => {
            try {
                const data = await ppeRequestsService.getPendingApproval(pageNumber, pageSize);
                if (!mounted.current || version.current !== requestVersion) return [];

                const items = data.items.filter((item) => !resolvedFolios.current.has(item.folio));
                const totalCount = Math.max(0, data.totalCount - (data.items.length - items.length));
                const totalPages = Math.ceil(totalCount / pageSize);
                const validPage = Math.min(data.pageNumber, Math.max(1, totalPages));
                // Concurrent backend changes may have removed the last page.
                const pageItems = validPage === data.pageNumber ? items : [];
                updatePage({
                    items: pageItems, pageNumber: validPage, pageSize, totalCount, totalPages,
                    hasPreviousPage: validPage > 1, hasNextPage: validPage < totalPages,
                });
                setNeedsPageLoad(pageItems.length === 0 && totalCount > 0);
                loadedRef.current = true;
                setLoaded(true);
                return pageItems;
            } catch (cause) {
                if (mounted.current && version.current === requestVersion) {
                    setError(getApiErrorMessage(cause, "No fue posible consultar las solicitudes por autorizar."));
                }
                return [];
            } finally {
                if (mounted.current && version.current === requestVersion) {
                    pendingLoad.current = null;
                    setLoading(false);
                }
            }
        })();
        pendingLoad.current = { pageNumber, promise };
        return promise;
    }, [hasRole, updatePage]);

    const removeResolved = useCallback((folio: string) => {
        resolvedFolios.current.add(folio);
        // Ignore every GET started before this mutation finished, including its counters.
        version.current += 1;
        pendingLoad.current = null;
        setLoading(false);
        setError(null);
        const current = pageRef.current;
        const totalCount = Math.max(0, current.totalCount - 1);
        const totalPages = Math.ceil(totalCount / pageSize);
        const pageNumber = Math.min(current.pageNumber, Math.max(1, totalPages));
        const items = pageNumber === current.pageNumber ? current.items.filter((item) => item.folio !== folio) : [];
        updatePage({
            items, pageNumber, pageSize, totalCount, totalPages,
            hasPreviousPage: pageNumber > 1, hasNextPage: pageNumber < totalPages,
        });
        // No GET after a mutation, even when the last page disappears. The UI offers Update.
        setNeedsPageLoad(items.length === 0 && totalCount > 0);
    }, [updatePage]);

    const clearMutationErrors = useCallback(() => {
        setApproveError(null);
        setRejectError(null);
    }, []);

    const approveRequest = useCallback(async (folio: string): Promise<ApprovePPERequestResult | null> => {
        if (!hasRole("Administrator") || !mounted.current || mutationInFlight.current || resolvedFolios.current.has(folio)) return null;
        mutationInFlight.current = true;
        setApprovingFolio(folio);
        setApproveError(null);
        try {
            const result = await ppeRequestsService.approve(folio);
            if (!mounted.current) return null;
            removeResolved(folio);
            return result;
        } catch (cause) {
            if (mounted.current) setApproveError(getApiErrorMessage(cause, "No fue posible aprobar la solicitud."));
            return null;
        } finally {
            mutationInFlight.current = false;
            if (mounted.current) setApprovingFolio(null);
        }
    }, [hasRole, removeResolved]);

    const rejectRequest = useCallback(async (folio: string, rejectionReason: string): Promise<RejectPPERequestResult | null> => {
        if (!hasRole("Administrator") || !mounted.current || mutationInFlight.current || resolvedFolios.current.has(folio)) return null;
        const reason = rejectionReason.trim();
        if (!reason) {
            setRejectError("El motivo del rechazo es obligatorio.");
            return null;
        }
        if (rejectionReason.length > 500) {
            setRejectError("El motivo del rechazo no puede superar los 500 caracteres.");
            return null;
        }
        mutationInFlight.current = true;
        setRejectingFolio(folio);
        setRejectError(null);
        try {
            const result = await ppeRequestsService.reject(folio, reason);
            if (!mounted.current) return null;
            removeResolved(folio);
            return result;
        } catch (cause) {
            if (mounted.current) setRejectError(getApiErrorMessage(cause, "No fue posible rechazar la solicitud."));
            return null;
        } finally {
            mutationInFlight.current = false;
            if (mounted.current) setRejectingFolio(null);
        }
    }, [hasRole, removeResolved]);

    return {
        pendingApprovalRequests: page.items,
        loaded, loading, error, needsPageLoad,
        pageNumber: page.pageNumber, totalCount: page.totalCount, totalPages: page.totalPages,
        hasPreviousPage: page.hasPreviousPage, hasNextPage: page.hasNextPage,
        approvingFolio, rejectingFolio, approveError, rejectError,
        getPendingApproval, approveRequest, rejectRequest, clearMutationErrors,
    };
};
