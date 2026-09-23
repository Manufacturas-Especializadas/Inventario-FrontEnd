import { useCallback, useRef, useState } from "react";
import { inventoryAdjustmentsService } from "../api/services/InventoryAdjustmentsService";
import type { CreateInventoryAdjustmentRequest, InventoryAdjustment, InventoryAdjustmentFilters, InventoryAdjustmentSummary } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

export const useInventoryAdjustments = () => {
    const [adjustments, setAdjustments] = useState<InventoryAdjustmentSummary[]>([]);
    const [hasLoadedList, setHasLoadedList] = useState(false);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [adjustment, setAdjustment] = useState<InventoryAdjustment | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const listVersion = useRef(0);
    const detailVersion = useRef(0);
    const pendingList = useRef<{ key: string; promise: Promise<void> } | null>(null);
    const details = useRef(new Map<string, InventoryAdjustment>());
    const pendingDetails = useRef(new Map<string, Promise<InventoryAdjustment>>());
    const pendingCreate = useRef<Promise<InventoryAdjustment | null> | null>(null);

    const clearList = useCallback(() => {
        listVersion.current += 1;
        pendingList.current = null;
        setAdjustments([]);
        setHasLoadedList(false);
        setLoadingList(false);
        setListError(null);
    }, []);

    const getAdjustments = useCallback((filters: InventoryAdjustmentFilters = {}) => {
        const key = JSON.stringify([filters.warehouseId, filters.dateFrom, filters.dateTo]);
        if (pendingList.current?.key === key) return pendingList.current.promise;
        const version = ++listVersion.current;
        setLoadingList(true);
        setListError(null);
        const promise = (async () => {
            try {
                const data = await inventoryAdjustmentsService.getList(filters);
                if (version !== listVersion.current) return;
                setAdjustments(data);
                setHasLoadedList(true);
            } catch (error) {
                if (version === listVersion.current) setListError(getApiErrorMessage(error, "No fue posible consultar el historial de ajustes."));
            } finally {
                if (version === listVersion.current) {
                    setLoadingList(false);
                    pendingList.current = null;
                }
            }
        })();
        pendingList.current = { key, promise };
        return promise;
    }, []);

    const clearAdjustment = useCallback(() => {
        detailVersion.current += 1;
        setAdjustment(null);
        setLoadingDetail(false);
        setDetailError(null);
    }, []);

    const getByFolio = useCallback(async (folio: string): Promise<InventoryAdjustment | null> => {
        const key = folio.trim();
        const version = ++detailVersion.current;
        setAdjustment(null);
        setDetailError(null);
        if (!key) {
            setLoadingDetail(false);
            setDetailError("Ingresa un folio de ajuste.");
            return null;
        }
        setLoadingDetail(true);
        try {
            let data = details.current.get(key);
            if (!data) {
                let request = pendingDetails.current.get(key);
                if (!request) {
                    request = inventoryAdjustmentsService.getByFolio(key).then((result) => {
                        details.current.set(key, result);
                        return result;
                    }).finally(() => pendingDetails.current.delete(key));
                    pendingDetails.current.set(key, request);
                }
                data = await request;
            }
            if (version !== detailVersion.current) return null;
            setAdjustment(data);
            return data;
        } catch (error) {
            if (version === detailVersion.current) setDetailError(getApiErrorMessage(error, "No fue posible consultar el ajuste de inventario."));
            return null;
        } finally {
            if (version === detailVersion.current) setLoadingDetail(false);
        }
    }, []);

    const createAdjustment = useCallback((request: CreateInventoryAdjustmentRequest) => {
        if (pendingCreate.current) return pendingCreate.current;
        setCreating(true);
        setCreateError(null);
        const version = ++detailVersion.current;
        setLoadingDetail(false);
        setDetailError(null);
        const promise = (async () => {
            try {
                const data = await inventoryAdjustmentsService.create(request);
                details.current.set(data.folio, data);
                if (version === detailVersion.current) setAdjustment(data);
                // POST lacks createdByName: keep the list unchanged until explicit refresh.
                return data;
            } catch (error) {
                setCreateError(getApiErrorMessage(error, "No fue posible crear el ajuste de inventario."));
                return null;
            } finally {
                setCreating(false);
                pendingCreate.current = null;
            }
        })();
        pendingCreate.current = promise;
        return promise;
    }, []);

    return {
        adjustments, hasLoadedList, loadingList, listError, getAdjustments, clearList,
        adjustment, loadingDetail, detailError, getByFolio, clearAdjustment,
        creating, createError, createAdjustment,
    };
};
