import { useCallback, useRef, useState } from "react";
import { productSuppliersService } from "../api/services/ProductSuppliersService";
import type { ProductSupplier } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface SupplierProductsEntry {
    data?: ProductSupplier[];
    loading: boolean;
    error: string | null;
}

export const useSupplierProducts = (supplierId: number | null) => {
    const cache = useRef(new Map<number, SupplierProductsEntry>());
    const pendingRequests = useRef(new Map<number, Promise<void>>());
    const [entries, setEntries] = useState(new Map<number, SupplierProductsEntry>());

    const load = useCallback((id: number) => {
        const pending = pendingRequests.current.get(id);
        if (pending) return pending;
        if (cache.current.get(id)?.data !== undefined) return Promise.resolve();

        cache.current.set(id, { loading: true, error: null });
        setEntries(new Map(cache.current));
        const request = (async () => {
            try {
                const data = await productSuppliersService.getBySupplier(id);
                cache.current.set(id, { data, loading: false, error: null });
            } catch (error) {
                cache.current.set(id, {
                    loading: false,
                    error: getApiErrorMessage(error, "No fue posible cargar los productos del proveedor."),
                });
            } finally {
                pendingRequests.current.delete(id);
                setEntries(new Map(cache.current));
            }
        })();
        pendingRequests.current.set(id, request);
        return request;
    }, []);

    // Responses only update their own key; a late response for A cannot replace B.
    const selected = supplierId === null ? undefined : entries.get(supplierId);
    return {
        supplierProducts: selected?.data ?? [],
        loadingSupplierProducts: selected?.loading ?? false,
        supplierProductsError: selected?.error ?? null,
        loadSupplierProducts: load,
    };
};
