import { useCallback, useEffect, useRef, useState } from "react";
import { ppeRequestsService } from "../api/services/PPERequestsService";
import type { DeliveryHistoryPPERequest, GetDeliveryHistoryParams, PagedResult, PPERequest } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

export const useDeliveryHistory = () => {
    const [page, setPage] = useState<PagedResult<DeliveryHistoryPPERequest> | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const listVersion = useRef(0);
    const pendingList = useRef<{ key: string; promise: Promise<void> } | null>(null);
    const mounted = useRef(true);

    const [selectedFolio, setSelectedFolio] = useState<string | null>(null);
    const [detail, setDetail] = useState<PPERequest | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const detailVersion = useRef(0);
    const detailRequests = useRef(new Map<string, Promise<PPERequest>>());

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const closeDetail = useCallback(() => {
        detailVersion.current += 1;
        setSelectedFolio(null);
        setDetail(null);
        setDetailError(null);
        setLoadingDetail(false);
    }, []);

    const clearHistory = useCallback(() => {
        listVersion.current += 1;
        pendingList.current = null;
        setPage(null);
        setLoading(false);
        setError(null);
        closeDetail();
    }, [closeDetail]);

    const getHistory = useCallback((params: GetDeliveryHistoryParams): Promise<void> => {
        if (!mounted.current) return Promise.resolve();
        if (!params.deliveredFrom || !params.deliveredTo || params.deliveredFrom > params.deliveredTo) {
            setError("Selecciona un rango válido: Desde no puede ser posterior a Hasta.");
            return Promise.resolve();
        }
        if (!Number.isInteger(params.pageNumber ?? 1) || (params.pageNumber ?? 1) < 1) return Promise.resolve();
        const key = JSON.stringify(params);
        if (pendingList.current?.key === key) return pendingList.current.promise;

        const version = ++listVersion.current;
        closeDetail();
        setLoading(true);
        setError(null);
        const promise = (async () => {
            try {
                const data = await ppeRequestsService.getDeliveryHistory(params);
                if (mounted.current && version === listVersion.current) setPage(data);
            } catch (cause) {
                if (mounted.current && version === listVersion.current) {
                    setError(getApiErrorMessage(cause, "No fue posible consultar el historial de entregas."));
                }
            } finally {
                if (mounted.current && version === listVersion.current) {
                    pendingList.current = null;
                    setLoading(false);
                }
            }
        })();
        pendingList.current = { key, promise };
        return promise;
    }, [closeDetail]);

    const getDetail = useCallback(async (folio: string) => {
        if (!mounted.current) return;
        const version = ++detailVersion.current;
        setSelectedFolio(folio);
        setDetail(null);
        setDetailError(null);
        setLoadingDetail(true);
        let request = detailRequests.current.get(folio);
        if (!request) {
            request = ppeRequestsService.getByFolio(folio);
            detailRequests.current.set(folio, request);
        }
        try {
            const data = await request;
            if (mounted.current && version === detailVersion.current) setDetail(data);
        } catch (cause) {
            if (mounted.current && version === detailVersion.current) {
                setDetailError(getApiErrorMessage(cause, "No fue posible consultar el detalle de la entrega."));
            }
        } finally {
            if (detailRequests.current.get(folio) === request) detailRequests.current.delete(folio);
            if (mounted.current && version === detailVersion.current) setLoadingDetail(false);
        }
    }, []);

    return { page, loading, error, getHistory, clearHistory, selectedFolio, detail, loadingDetail, detailError, getDetail, closeDetail };
};
