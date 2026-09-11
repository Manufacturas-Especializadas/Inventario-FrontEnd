import {
    apiClient,
} from "../client";

import type {
    CreateProductSizeRequest,
    ProductSize,
    SetProductSizeStatusRequest,
    UpdateProductSizeRequest,
} from "../../types/types";

export const sizesService = {
    async getAll(): Promise<ProductSize[]> {
        const response =
            await apiClient.get<ProductSize[]>(
                "/sizes"
            );

        return response.data;
    },

    async create(
        request: CreateProductSizeRequest
    ): Promise<ProductSize> {
        const response =
            await apiClient.post<ProductSize>(
                "/sizes",
                request
            );

        return response.data;
    },

    async update(
        id: number,
        request: UpdateProductSizeRequest
    ): Promise<ProductSize> {
        const response =
            await apiClient.put<ProductSize>(
                `/sizes/${id}`,
                request
            );

        return response.data;
    },

    async setStatus(
        id: number,
        request: SetProductSizeStatusRequest
    ): Promise<ProductSize> {
        const response =
            await apiClient.put<ProductSize>(
                `/sizes/${id}/status`,
                request
            );

        return response.data;
    },
};