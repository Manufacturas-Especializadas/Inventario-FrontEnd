import { useCallback, useEffect, useRef, useState } from "react";
import { ppeRequestsService } from "../api/services/PPERequestsService";
import type { PPERequestFormOptions, RequestablePPEProduct } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

export const usePPERequestFormOptions = () => {
    const [options, setOptions] = useState<PPERequestFormOptions | null>(null);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const cachedOptions = useRef<PPERequestFormOptions | null>(null);
    const optionsRequest = useRef<Promise<PPERequestFormOptions | null> | null>(null);
    const mounted = useRef(true);

    const [warehouseId, setWarehouseId] = useState("");
    const [products, setProducts] = useState<RequestablePPEProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [productsError, setProductsError] = useState<string | null>(null);
    const [loadedWarehouseId, setLoadedWarehouseId] = useState<number | null>(null);
    const selectedWarehouse = useRef("");
    const loadedWarehouse = useRef<number | null>(null);
    const productsVersion = useRef(0);
    const productRequests = useRef(new Map<number, Promise<RequestablePPEProduct[]>>());

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const loadOptions = useCallback((): Promise<PPERequestFormOptions | null> => {
        if (cachedOptions.current) return Promise.resolve(cachedOptions.current);
        if (optionsRequest.current) return optionsRequest.current;

        setLoadingOptions(true);
        setOptionsError(null);
        const request = (async () => {
            try {
                const data = await ppeRequestsService.getFormOptions();
                if (!mounted.current) return null;
                cachedOptions.current = data;
                setOptions(data);
                return data;
            } catch (error) {
                if (mounted.current) {
                    setOptionsError(getApiErrorMessage(error, "No fue posible cargar las opciones de solicitud."));
                }
                return null;
            } finally {
                optionsRequest.current = null;
                if (mounted.current) setLoadingOptions(false);
            }
        })();
        optionsRequest.current = request;
        return request;
    }, []);

    const selectWarehouse = useCallback(async (value: string) => {
        if (!mounted.current) return;
        const id = Number(value);
        if (selectedWarehouse.current === value &&
            (loadedWarehouse.current === id || productRequests.current.has(id))) return;

        selectedWarehouse.current = value;
        setWarehouseId(value);
        const version = ++productsVersion.current;
        loadedWarehouse.current = null;
        setLoadedWarehouseId(null);
        setProducts([]);
        setProductsError(null);

        if (!cachedOptions.current?.warehouses.some((warehouse) => warehouse.id === id)) {
            setLoadingProducts(false);
            return;
        }

        setLoadingProducts(true);
        // Reuse an in-flight GET if the user returns to a warehouse before it finishes.
        let request = productRequests.current.get(id);
        if (!request) {
            request = ppeRequestsService.getRequestableProducts(id);
            productRequests.current.set(id, request);
        }

        try {
            const data = await request;
            if (!mounted.current || version !== productsVersion.current) return;
            loadedWarehouse.current = id;
            setLoadedWarehouseId(id);
            setProducts(data);
        } catch (error) {
            if (!mounted.current || version !== productsVersion.current) return;
            setProductsError(getApiErrorMessage(error, "No fue posible cargar los productos del almacén."));
        } finally {
            if (productRequests.current.get(id) === request) productRequests.current.delete(id);
            if (mounted.current && version === productsVersion.current) setLoadingProducts(false);
        }
    }, []);

    const resetWarehouse = useCallback(() => {
        productsVersion.current += 1;
        selectedWarehouse.current = "";
        loadedWarehouse.current = null;
        setWarehouseId("");
        setLoadedWarehouseId(null);
        setProducts([]);
        setProductsError(null);
        setLoadingProducts(false);
    }, []);

    return {
        options,
        loadingOptions,
        optionsError,
        loadOptions,
        warehouseId,
        products,
        loadingProducts,
        productsError,
        loadedWarehouseId,
        selectWarehouse,
        resetWarehouse,
    };
};
