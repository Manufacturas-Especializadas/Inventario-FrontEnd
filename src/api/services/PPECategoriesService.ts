import { apiClient } from "../client";

import type {
    CreatePPECategoryRequest,
    PPECategory,
} from "../../types/types";

export const ppeCategoriesService = {
    async getAll(): Promise<PPECategory[]> {
        const response =
            await apiClient.get<PPECategory[]>(
                "/ppe-categories"
            );

        return response.data;
    },

    async create(
        request: CreatePPECategoryRequest
    ): Promise<PPECategory> {
        const response =
            await apiClient.post<PPECategory>(
                "/ppe-categories",
                request
            );

        return response.data;
    },
};