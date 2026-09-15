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
    const [
        suppliers,
        setSuppliers,
    ] = useState<Supplier[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

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

            const request = (async () => {
                try {
                    const data =
                        await suppliersService
                            .getAll();

                    setSuppliers(data);
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
                }
            })();
            pendingRequest.current = request;
            return request;
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
    };
};
