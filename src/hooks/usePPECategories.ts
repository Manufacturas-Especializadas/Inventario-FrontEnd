import {
    useCallback,
    useEffect,
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


export const usePPECategories = () => {
    const [
        categories,
        setCategories,
    ] = useState<PPECategory[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(false);


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


    const replaceCategory = (
        current: PPECategory[],
        updatedCategory: PPECategory
    ) => {
        return current.map(
            (category) =>
                category.id ===
                    updatedCategory.id
                    ? updatedCategory
                    : category
        );
    };


    const getCategories =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await ppeCategoriesService
                        .getAll();

                setCategories(
                    data
                );

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
            }
        }, []);


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

                    setCategories(
                        (current) =>
                            replaceCategory(
                                current,
                                updatedCategory
                            )
                    );

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
            []
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

                    setCategories(
                        (current) =>
                            replaceCategory(
                                current,
                                updatedCategory
                            )
                    );

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
            []
        );


    const clearError =
        useCallback(() => {
            setError(null);
            setActionError(null);
        }, []);


    useEffect(() => {
        void getCategories();
    }, [getCategories]);


    return {
        categories,

        loading,
        updatingId,
        changingStatusId,
        actionError,
        error,

        refresh:
            getCategories,

        updateCategory,
        setCategoryStatus,

        clearError,
    };
};