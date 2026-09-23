import { apiClient } from "../client";

import type {
    CreatePPEProductRequest,
    PPEProduct,
    SetPPEProductStatusRequest,
    UpdatePPEProductRequest,
} from "../../types/types";

export const ppeProductsService = {
    async getAll(): Promise<PPEProduct[]> {
        const response =
            await apiClient.get<PPEProduct[]>(
                "/ppe-products"
            );

        return response.data;
    },

    async create(
        request: CreatePPEProductRequest
    ): Promise<PPEProduct> {
        const response =
            await apiClient.post<PPEProduct>(
                "/ppe-products",
                request
            );

        return response.data;
    },

    async update(
        id: number,
        request: UpdatePPEProductRequest
    ): Promise<PPEProduct> {
        const response =
            await apiClient.put<PPEProduct>(
                `/ppe-products/${id}`,
                request
            );

        return response.data;
    },

    async setStatus(
        id: number,
        request: SetPPEProductStatusRequest
    ): Promise<PPEProduct> {
        const response =
            await apiClient.put<PPEProduct>(
                `/ppe-products/${id}/status`,
                request
            );

        return response.data;
    },
};
