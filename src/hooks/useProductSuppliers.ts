import { useCallback, useRef, useState } from "react";
import { productSuppliersService } from "../api/services/ProductSuppliersService";
import type { ProductSupplier } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface ProductRelations {
    data?: ProductSupplier[];
    loading: boolean;
    error: string | null;
}

const mergeRelation = (relations: ProductSupplier[], relation: ProductSupplier) =>
    relations.some((current) => current.supplierId === relation.supplierId)
        ? relations.map((current) => current.supplierId === relation.supplierId ? relation : current)
        : [...relations, relation];

export const useProductSuppliers = (ppeProductId: number | null) => {
    const cache = useRef(new Map<number, ProductRelations>());
    const pendingRequests = useRef(new Map<number, Promise<void>>());
    const updatesDuringLoad = useRef(new Map<number, ProductSupplier[]>());
    const [entries, setEntries] = useState(new Map<number, ProductRelations>());

    const load = useCallback((productId: number, force: boolean) => {
        const pending = pendingRequests.current.get(productId);
        if (pending) return pending;
        const previous = cache.current.get(productId);
        if (!force && previous?.data !== undefined && !previous.error) return Promise.resolve();

        cache.current.set(productId, { data: previous?.data, loading: true, error: null });
        setEntries(new Map(cache.current));
        updatesDuringLoad.current.set(productId, []);
        const request = (async () => {
            try {
                const data = await productSuppliersService.getByProduct(productId);
                const merged = (updatesDuringLoad.current.get(productId) ?? []).reduce(mergeRelation, data);
                cache.current.set(productId, { data: merged, loading: false, error: null });
            } catch (error) {
                cache.current.set(productId, {
                    data: cache.current.get(productId)?.data,
                    loading: false,
                    error: getApiErrorMessage(error, "No fue posible cargar los proveedores del producto."),
                });
            } finally {
                pendingRequests.current.delete(productId);
                updatesDuringLoad.current.delete(productId);
                setEntries(new Map(cache.current));
            }
        })();
        pendingRequests.current.set(productId, request);
        return request;
    }, []);

    const loadByProduct = useCallback((productId: number) => load(productId, false), [load]);
    const refresh = useCallback((productId: number) => load(productId, true), [load]);
    const upsertRelation = useCallback((relation: ProductSupplier) => {
        const productId = relation.ppeProductId;
        if (pendingRequests.current.has(productId)) {
            updatesDuringLoad.current.get(productId)?.push(relation);
        }
        const entry = cache.current.get(productId);
        // A POST alone does not mean all relations for this product have been loaded.
        if (entry?.data === undefined) return;
        cache.current.set(productId, { ...entry, data: mergeRelation(entry.data, relation) });
        setEntries(new Map(cache.current));
    }, []);

    const selected = ppeProductId === null ? undefined : entries.get(ppeProductId);
    return {
        productSuppliers: selected?.data ?? [],
        loading: selected?.loading ?? false,
        error: selected?.error ?? null,
        hasLoaded: selected?.data !== undefined,
        loadByProduct,
        refresh,
        upsertRelation,
    };
};
