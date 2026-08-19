import { apiClient } from "../client";

import type {
    CreatePPEProductRequest,
    PPEProduct,
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
};