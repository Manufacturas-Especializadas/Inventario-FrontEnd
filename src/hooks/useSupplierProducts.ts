import {
    useCallback,
    useRef,
    useState,
} from "react";

import {
    productSuppliersService,
} from "../api/services/ProductSuppliersService";

import type {
    ProductSupplier,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface SupplierProductsEntry {
    data?: ProductSupplier[];
    loading: boolean;
    error: string | null;
}


const mergeRelation = (
    relations: ProductSupplier[],
    relation: ProductSupplier
) =>
    relations.some(
        (current) =>
            current.ppeProductId ===
            relation.ppeProductId
    )
        ? relations.map(
            (current) =>
                current.ppeProductId ===
                    relation.ppeProductId
                    ? relation
                    : current
        )
        : [
            ...relations,
            relation,
        ];


export const useSupplierProducts = (
    supplierId: number | null
) => {
    const cache =
        useRef(
            new Map<
                number,
                SupplierProductsEntry
            >()
        );

    const pendingRequests =
        useRef(
            new Map<
                number,
                Promise<void>
            >()
        );

    const updatesDuringLoad =
        useRef(
            new Map<
                number,
                ProductSupplier[]
            >()
        );

    const [
        entries,
        setEntries,
    ] = useState(
        new Map<
            number,
            SupplierProductsEntry
        >()
    );


    const load =
        useCallback(
            (
                id: number,
                force = false
            ) => {
                const pending =
                    pendingRequests.current.get(
                        id
                    );

                if (pending) {
                    return pending;
                }


                const previous =
                    cache.current.get(
                        id
                    );


                if (
                    !force &&
                    previous?.data !==
                    undefined &&
                    !previous.error
                ) {
                    return Promise.resolve();
                }


                cache.current.set(
                    id,
                    {
                        data:
                            previous?.data,

                        loading: true,

                        error: null,
                    }
                );

                setEntries(
                    new Map(
                        cache.current
                    )
                );


                updatesDuringLoad
                    .current
                    .set(
                        id,
                        []
                    );


                const request =
                    (async () => {
                        try {
                            const data =
                                await productSuppliersService
                                    .getBySupplier(
                                        id
                                    );


                            const merged =
                                (
                                    updatesDuringLoad
                                        .current
                                        .get(
                                            id
                                        ) ?? []
                                ).reduce(
                                    mergeRelation,
                                    data
                                );


                            cache.current.set(
                                id,
                                {
                                    data:
                                        merged,

                                    loading:
                                        false,

                                    error:
                                        null,
                                }
                            );
                        } catch (error) {
                            cache.current.set(
                                id,
                                {
                                    data:
                                        cache.current.get(id)?.data,

                                    loading:
                                        false,

                                    error:
                                        getApiErrorMessage(
                                            error,
                                            "No fue posible cargar los productos del proveedor."
                                        ),
                                }
                            );
                        } finally {
                            pendingRequests
                                .current
                                .delete(
                                    id
                                );

                            updatesDuringLoad
                                .current
                                .delete(
                                    id
                                );

                            setEntries(
                                new Map(
                                    cache.current
                                )
                            );
                        }
                    })();


                pendingRequests
                    .current
                    .set(
                        id,
                        request
                    );

                return request;
            },
            []
        );


    const loadSupplierProducts =
        useCallback(
            (
                id: number
            ) =>
                load(
                    id,
                    false
                ),
            [load]
        );


    const refreshSupplierProducts =
        useCallback(
            (
                id: number
            ) =>
                load(
                    id,
                    true
                ),
            [load]
        );


    const upsertRelation =
        useCallback(
            (
                relation: ProductSupplier
            ) => {
                const id =
                    relation.supplierId;


                if (
                    pendingRequests
                        .current
                        .has(id)
                ) {
                    updatesDuringLoad
                        .current
                        .get(id)
                        ?.push(
                            relation
                        );
                }


                const entry =
                    cache.current.get(
                        id
                    );


                if (
                    entry?.data ===
                    undefined
                ) {
                    return;
                }


                cache.current.set(
                    id,
                    {
                        ...entry,

                        data:
                            mergeRelation(
                                entry.data,
                                relation
                            ),
                    }
                );


                setEntries(
                    new Map(
                        cache.current
                    )
                );
            },
            []
        );


    const selected =
        supplierId === null
            ? undefined
            : entries.get(
                supplierId
            );


    return {
        supplierProducts:
            selected?.data ?? [],

        loadingSupplierProducts:
            selected?.loading ??
            false,

        supplierProductsError:
            selected?.error ??
            null,

        hasLoadedSupplierProducts:
            selected?.data !==
            undefined,

        loadSupplierProducts,
        refreshSupplierProducts,
        upsertRelation,
    };
};
