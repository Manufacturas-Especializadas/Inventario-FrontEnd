import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    suppliersService,
} from "../api/services/SuppliersService";

import type {
    Supplier,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

interface UseSuppliersOptions {
    autoLoad?: boolean;
}

export const useSuppliers = ({ autoLoad = true }: UseSuppliersOptions = {}) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, Supplier>());
    const [
        suppliers,
        setSuppliers,
    ] = useState<Supplier[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(autoLoad);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const getSuppliers =
        useCallback(() => {
            if (pendingRequest.current) return pendingRequest.current;
            setLoading(true);
            setError(null);
            updatesDuringLoad.current.clear();

            const request = (async () => {
                try {
                    const data =
                        await suppliersService
                            .getAll();

                    // Preserve successful mutations that finished while this GET was pending.
                    const merged = new Map(data.map((supplier) => [supplier.id, supplier]));
                    updatesDuringLoad.current.forEach((supplier) => {
                        merged.set(supplier.id, supplier);
                    });
                    setSuppliers(Array.from(merged.values()));
                    setHasLoaded(true);
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar los proveedores."
                        )
                    );
                } finally {
                    setLoading(false);
                    pendingRequest.current = null;
                    updatesDuringLoad.current.clear();
                }
            })();
            pendingRequest.current = request;
            return request;
        }, []);

    const upsertSupplier = useCallback((supplier: Supplier) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(supplier.id, supplier);
        }

        setSuppliers((current) => current.some((entry) => entry.id === supplier.id)
            ? current.map((entry) => entry.id === supplier.id ? supplier : entry)
            : [...current, supplier]);
    }, []);

    useEffect(() => {
        if (autoLoad) void getSuppliers();
    }, [autoLoad, getSuppliers]);

    return {
        suppliers,
        hasLoaded,
        loading,
        error,
        refresh: getSuppliers,
        upsertSupplier,
    };
};
