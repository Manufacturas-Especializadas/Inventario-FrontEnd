import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ppeCategoriesService,
} from "../api/services/PPECategoriesService";

import type {
    PPECategory,
    SetPPECategoryStatusRequest,
    UpdatePPECategoryRequest,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface UsePPECategoriesOptions {
    autoLoad?: boolean;
}

export const usePPECategories = ({ autoLoad = false }: UsePPECategoriesOptions = {}) => {
    const pendingRequest = useRef<Promise<PPECategory[]> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, PPECategory>());
    const [
        categories,
        setCategories,
    ] = useState<PPECategory[]>([]);

    const [
        hasLoaded,
        setHasLoaded,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(autoLoad);


    const [
        updatingId,
        setUpdatingId,
    ] = useState<number | null>(
        null
    );


    const [
        changingStatusId,
        setChangingStatusId,
    ] = useState<number | null>(
        null
    );


    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const [
        actionError,
        setActionError,
    ] = useState<string | null>(
        null
    );


    const upsertCategory = useCallback((category: PPECategory) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(category.id, category);
        }

        setCategories((current) => current.some((entry) => entry.id === category.id)
            ? current.map((entry) => entry.id === category.id ? category : entry)
            : [...current, category]);
    }, []);


    const getCategories =
        useCallback(() => {
            if (pendingRequest.current) return pendingRequest.current;

            setLoading(true);
            setError(null);
            updatesDuringLoad.current.clear();

            const request = (async () => {
                try {
                    const data =
                        await ppeCategoriesService
                            .getAll();

                    // Preserve successful mutations that finished while this GET was pending.
                    const merged = new Map(data.map((category) => [category.id, category]));
                    updatesDuringLoad.current.forEach((category) => {
                        merged.set(category.id, category);
                    });
                    setCategories(Array.from(merged.values()));
                    setHasLoaded(true);
                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar las categorías."
                        )
                    );

                    return [];
                } finally {
                    setLoading(false);
                    pendingRequest.current = null;
                    updatesDuringLoad.current.clear();
                }
            })();

            pendingRequest.current = request;
            return request;
        }, []);

    useEffect(() => {
        if (autoLoad) void getCategories();
    }, [autoLoad, getCategories]);


    const updateCategory =
        useCallback(
            async (
                id: number,
                request:
                    UpdatePPECategoryRequest
            ): Promise<PPECategory | null> => {
                setUpdatingId(id);
                setActionError(null);

                try {
                    const updatedCategory =
                        await ppeCategoriesService
                            .update(
                                id,
                                request
                            );

                    upsertCategory(updatedCategory);

                    return updatedCategory;
                } catch (error) {
                    setActionError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar la categoría."
                        )
                    );

                    return null;
                } finally {
                    setUpdatingId(
                        null
                    );
                }
            },
            [upsertCategory]
        );


    const setCategoryStatus =
        useCallback(
            async (
                id: number,
                request:
                    SetPPECategoryStatusRequest
            ): Promise<PPECategory | null> => {
                setChangingStatusId(
                    id
                );

                setActionError(null);

                try {
                    const updatedCategory =
                        await ppeCategoriesService
                            .setStatus(
                                id,
                                request
                            );

                    upsertCategory(updatedCategory);

                    return updatedCategory;
                } catch (error) {
                    setActionError(
                        getApiErrorMessage(
                            error,
                            request.isActive
                                ? "No fue posible activar la categoría."
                                : "No fue posible desactivar la categoría."
                        )
                    );

                    return null;
                } finally {
                    setChangingStatusId(
                        null
                    );
                }
            },
            [upsertCategory]
        );


    const clearError =
        useCallback(() => {
            setError(null);
            setActionError(null);
        }, []);


    return {
        categories,

        loading,
        hasLoaded,
        updatingId,
        changingStatusId,
        actionError,
        error,

        refresh: getCategories,
        upsertCategory,

        updateCategory,
        setCategoryStatus,

        clearError,
    };
};
