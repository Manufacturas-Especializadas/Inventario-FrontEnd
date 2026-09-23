import {
    apiClient,
} from "../client";

import type {
    CreateProductColorRequest,
    ProductColor,
    SetProductColorStatusRequest,
    UpdateProductColorRequest,
} from "../../types/types";

export const colorsService = {
    async getAll(): Promise<ProductColor[]> {
        const response =
            await apiClient.get<ProductColor[]>(
                "/colors"
            );

        return response.data;
    },

    async create(
        request: CreateProductColorRequest
    ): Promise<ProductColor> {
        const response =
            await apiClient.post<ProductColor>(
                "/colors",
                request
            );

        return response.data;
    },

    async update(
        id: number,
        request: UpdateProductColorRequest
    ): Promise<ProductColor> {
        const response =
            await apiClient.put<ProductColor>(
                `/colors/${id}`,
                request
            );

        return response.data;
    },

    async setStatus(
        id: number,
        request: SetProductColorStatusRequest
    ): Promise<ProductColor> {
        const response =
            await apiClient.put<ProductColor>(
                `/colors/${id}/status`,
                request
            );

        return response.data;
    },
};