import {
    useCallback,
    useState,
} from "react";

import { warehouseProductsService } from "../api/services/WarehouseProductsService.ts";

import type {
    WarehouseProduct,
} from "../types/types.ts";

import {
    getApiErrorMessage,
} from "../utils/utils.ts";


export const useWarehouseProducts = () => {
    const [
        relationsByWarehouse,
        setRelationsByWarehouse,
    ] = useState<Record<number, WarehouseProduct[]>>({});

    const [
        loadedWarehouseIds,
        setLoadedWarehouseIds,
    ] = useState<Set<number>>(
        () => new Set()
    );

    const [
        loadingWarehouseId,
        setLoadingWarehouseId,
    ] = useState<number | null>(null);

    const [
        error,
        setError,
    ] = useState<string | null>(null);


    const getByWarehouse =
        useCallback(
            async (
                warehouseId: number,
                force = false
            ) => {
                if (
                    !force &&
                    loadedWarehouseIds.has(warehouseId)
                ) {
                    return;
                }

                setLoadingWarehouseId(warehouseId);
                setError(null);

                try {
                    const data =
                        await warehouseProductsService
                            .getByWarehouse(
                                warehouseId
                            );

                    setRelationsByWarehouse(
                        (current) => ({
                            ...current,
                            [warehouseId]: data,
                        })
                    );

                    setLoadedWarehouseIds(
                        (current) => {
                            const next =
                                new Set(current);

                            next.add(warehouseId);

                            return next;
                        }
                    );
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible cargar los productos del almacén."
                        )
                    );
                } finally {
                    setLoadingWarehouseId(
                        (current) =>
                            current === warehouseId
                                ? null
                                : current
                    );
                }
            },
            [loadedWarehouseIds]
        );


    const upsertRelation =
        useCallback(
            (
                relation: WarehouseProduct
            ) => {
                setRelationsByWarehouse(
                    (current) => {
                        const warehouseRelations =
                            current[
                            relation.warehouseId
                            ] ?? [];

                        const exists =
                            warehouseRelations.some(
                                (entry) =>
                                    entry.ppeProductId ===
                                    relation.ppeProductId
                            );

                        const updated =
                            exists
                                ? warehouseRelations.map(
                                    (entry) =>
                                        entry.ppeProductId ===
                                            relation.ppeProductId
                                            ? relation
                                            : entry
                                )
                                : [
                                    ...warehouseRelations,
                                    relation,
                                ];

                        return {
                            ...current,
                            [relation.warehouseId]:
                                updated,
                        };
                    }
                );
            },
            []
        );


    const getCachedByWarehouse =
        useCallback(
            (warehouseId: number) =>
                relationsByWarehouse[
                warehouseId
                ] ?? [],
            [relationsByWarehouse]
        );


    const hasLoadedWarehouse =
        useCallback(
            (warehouseId: number) =>
                loadedWarehouseIds.has(
                    warehouseId
                ),
            [loadedWarehouseIds]
        );


    const refreshWarehouse =
        useCallback(
            async (
                warehouseId: number
            ) => {
                await getByWarehouse(
                    warehouseId,
                    true
                );
            },
            [getByWarehouse]
        );


    const clearError =
        useCallback(() => {
            setError(null);
        }, []);


    return {
        loadingWarehouseId,
        error,

        getByWarehouse,
        refreshWarehouse,

        getCachedByWarehouse,
        hasLoadedWarehouse,

        upsertRelation,

        clearError,
    };
};