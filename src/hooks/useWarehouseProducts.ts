import { useCallback, useRef, useState } from "react";
import { warehouseProductsService } from "../api/services/WarehouseProductsService.ts";
import type { WarehouseProduct } from "../types/types.ts";
import { getApiErrorMessage } from "../utils/utils.ts";

export const useWarehouseProducts = () => {
    const [relationsByWarehouse, setRelationsByWarehouse] = useState<Record<number, WarehouseProduct[]>>({});
    const [loadedWarehouseIds, setLoadedWarehouseIds] = useState<Set<number>>(() => new Set());
    const [loadingByWarehouse, setLoadingByWarehouse] = useState<Record<number, boolean>>({});
    const [errorsByWarehouse, setErrorsByWarehouse] = useState<Record<number, string | null>>({});
    const loaded = useRef(new Set<number>());
    const pendingRequests = useRef(new Map<number, {
        promise: Promise<void>;
        updates: Map<number, WarehouseProduct>;
    }>());

    const getByWarehouse = useCallback((warehouseId: number, force = false): Promise<void> => {
        const pending = pendingRequests.current.get(warehouseId);
        if (pending) return pending.promise;
        if (!force && loaded.current.has(warehouseId)) return Promise.resolve();

        setLoadingByWarehouse((current) => ({ ...current, [warehouseId]: true }));
        setErrorsByWarehouse((current) => ({ ...current, [warehouseId]: null }));
        const updates = new Map<number, WarehouseProduct>();
        const promise = (async () => {
            try {
                const data = await warehouseProductsService.getByWarehouse(warehouseId);
                // Preserve status mutations that completed while this warehouse's GET was pending.
                const merged = new Map(data.map((relation) => [relation.ppeProductId, relation]));
                updates.forEach((relation) => merged.set(relation.ppeProductId, relation));
                setRelationsByWarehouse((current) => ({ ...current, [warehouseId]: Array.from(merged.values()) }));
                loaded.current.add(warehouseId);
                setLoadedWarehouseIds((current) => new Set(current).add(warehouseId));
            } catch (error) {
                setErrorsByWarehouse((current) => ({
                    ...current,
                    [warehouseId]: getApiErrorMessage(error, "No fue posible cargar los productos del almacén."),
                }));
            } finally {
                pendingRequests.current.delete(warehouseId);
                setLoadingByWarehouse((current) => ({ ...current, [warehouseId]: false }));
            }
        })();
        pendingRequests.current.set(warehouseId, { promise, updates });
        return promise;
    }, []);

    const upsertRelation = useCallback((relation: WarehouseProduct) => {
        pendingRequests.current.get(relation.warehouseId)?.updates.set(relation.ppeProductId, relation);
        setRelationsByWarehouse((current) => {
            const relations = current[relation.warehouseId] ?? [];
            const exists = relations.some((entry) => entry.ppeProductId === relation.ppeProductId);
            return {
                ...current,
                [relation.warehouseId]: exists
                    ? relations.map((entry) => entry.ppeProductId === relation.ppeProductId ? relation : entry)
                    : [...relations, relation],
            };
        });
    }, []);

    const getCachedByWarehouse = useCallback((id: number) => relationsByWarehouse[id] ?? [], [relationsByWarehouse]);
    const hasLoadedWarehouse = useCallback((id: number) => loadedWarehouseIds.has(id), [loadedWarehouseIds]);
    const isLoadingWarehouse = useCallback((id: number) => loadingByWarehouse[id] ?? false, [loadingByWarehouse]);
    const getWarehouseError = useCallback((id: number) => errorsByWarehouse[id] ?? null, [errorsByWarehouse]);
    const refreshWarehouse = useCallback((id: number) => getByWarehouse(id, true), [getByWarehouse]);

    return {
        getByWarehouse, refreshWarehouse, getCachedByWarehouse, hasLoadedWarehouse,
        isLoadingWarehouse, getWarehouseError, upsertRelation,
    };
};
