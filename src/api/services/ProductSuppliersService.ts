import {
    apiClient,
} from "../client";

import type {
    CreateProductSupplierRequest,
    ProductSupplier,
} from "../../types/types";

export const productSuppliersService = {
    async getByProduct(
        ppeProductId: number
    ): Promise<ProductSupplier[]> {
        const response =
            await apiClient.get<ProductSupplier[]>(
                `/product-suppliers/${ppeProductId}`
            );

        return response.data;
    },

    async create(
        request: CreateProductSupplierRequest
    ): Promise<ProductSupplier> {
        const response =
            await apiClient.post<ProductSupplier>(
                "/product-suppliers",
                request
            );

        return response.data;
    },
};