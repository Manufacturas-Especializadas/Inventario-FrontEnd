import { useCallback, useEffect, useRef, useState } from "react";
import { organizationalUnitPPELimitsService } from "../api/services/OrganizationalUnitPPELimitsService";
import type { OrganizationalUnitPPELimit, SetOrganizationalUnitPPELimitRequest } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface GetLimitsParams {
    organizationalUnitId?: number | null;
    ppeProductId?: number | null;
}

interface UseOrganizationalUnitPPELimitsOptions {
    autoLoad?: boolean;
}

const limitKey = (limit: OrganizationalUnitPPELimit) => `${limit.organizationalUnitId}:${limit.ppeProductId}`;
const matches = (limit: OrganizationalUnitPPELimit, params: GetLimitsParams) =>
    (params.organizationalUnitId == null || limit.organizationalUnitId === params.organizationalUnitId) &&
    (params.ppeProductId == null || limit.ppeProductId === params.ppeProductId);

export const useOrganizationalUnitPPELimits = ({ autoLoad = true }: UseOrganizationalUnitPPELimitsOptions = {}) => {
    const [limits, setLimits] = useState<OrganizationalUnitPPELimit[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const pendingSave = useRef(false);
    const activeKey = useRef("[null,null]");
    const loadedParams = useRef<GetLimitsParams | null>(null);
    const pendingRequests = useRef(new Map<string, {
        promise: Promise<OrganizationalUnitPPELimit[]>;
        updates: Map<string, OrganizationalUnitPPELimit>;
    }>());

    const getLimits = useCallback((params: GetLimitsParams = {}): Promise<OrganizationalUnitPPELimit[]> => {
        const filters = { organizationalUnitId: params.organizationalUnitId ?? null, ppeProductId: params.ppeProductId ?? null };
        const key = JSON.stringify([filters.organizationalUnitId, filters.ppeProductId]);
        // Different query scopes must not display each other's results or errors.
        if (activeKey.current !== key) {
            activeKey.current = key;
            loadedParams.current = null;
            setHasLoaded(false);
            setLimits([]);
        }
        setLoading(true);
        setError(null);
        const pending = pendingRequests.current.get(key);
        if (pending) return pending.promise;
        const updates = new Map<string, OrganizationalUnitPPELimit>();
        const promise = (async () => {
            try {
                const data = await organizationalUnitPPELimitsService.getAll(filters);
                const merged = new Map(data.map((limit) => [limitKey(limit), limit]));
                updates.forEach((limit, pair) => {
                    if (matches(limit, filters)) merged.set(pair, limit);
                    else merged.delete(pair);
                });
                const result = Array.from(merged.values());
                if (activeKey.current === key) {
                    setLimits(result);
                    loadedParams.current = filters;
                    setHasLoaded(true);
                }
                return result;
            } catch (error) {
                if (activeKey.current === key) setError(getApiErrorMessage(error, "No fue posible consultar los límites de EPP."));
                return [];
            } finally {
                pendingRequests.current.delete(key);
                if (activeKey.current === key) setLoading(false);
            }
        })();
        pendingRequests.current.set(key, { promise, updates });
        return promise;
    }, []);

    const setLimit = useCallback(async (request: SetOrganizationalUnitPPELimitRequest): Promise<OrganizationalUnitPPELimit | null> => {
        if (pendingSave.current) return null;
        if (!Number.isInteger(request.maxQuantityPerCycle) || request.maxQuantityPerCycle <= 0) {
            setSaveError("El máximo por ciclo debe ser un número entero mayor a cero.");
            return null;
        }
        pendingSave.current = true;
        setSaving(true);
        setSaveError(null);
        try {
            const data = await organizationalUnitPPELimitsService.set(request);
            const pair = limitKey(data);
            pendingRequests.current.forEach(({ updates }) => updates.set(pair, data));
            const filters = loadedParams.current;
            if (filters !== null) {
                setLimits((current) => {
                    const remaining = current.filter((limit) => limitKey(limit) !== pair);
                    return matches(data, filters) ? [...remaining, data] : remaining;
                });
            }
            return data;
        } catch (error) {
            setSaveError(getApiErrorMessage(error, "No fue posible guardar el límite de EPP."));
            return null;
        } finally {
            pendingSave.current = false;
            setSaving(false);
        }
    }, []);

    const clearError = useCallback(() => setSaveError(null), []);
    const refresh = useCallback(async () => { await getLimits(); }, [getLimits]);

    useEffect(() => {
        if (!autoLoad) return;
        let active = true;
        queueMicrotask(() => { if (active) void refresh(); });
        return () => { active = false; };
    }, [autoLoad, refresh]);

    return { limits, hasLoaded, loading, saving, error, saveError, getLimits, setLimit, refresh, clearError };
};
