import {
    apiClient,
} from "../client";

import type {
    CreateProductSupplierRequest,
    ProductSupplier,
    SetProductSupplierStatusRequest,
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

    async getBySupplier(
        supplierId: number
    ): Promise<ProductSupplier[]> {
        const response =
            await apiClient.get<ProductSupplier[]>(
                `/product-suppliers/by-supplier/${supplierId}`
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

    async setStatus(
        ppeProductId: number,
        supplierId: number,
        request: SetProductSupplierStatusRequest
    ): Promise<ProductSupplier> {
        const response =
            await apiClient.put<ProductSupplier>(
                `/product-suppliers/${ppeProductId}/${supplierId}/status`,
                request
            );

        return response.data;
    },
};
