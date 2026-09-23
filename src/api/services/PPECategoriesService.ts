import {
    apiClient,
} from "../client";

import type {
    CreatePPECategoryRequest,
    PPECategory,
    SetPPECategoryStatusRequest,
    UpdatePPECategoryRequest,
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


    async update(
        id: number,
        request: UpdatePPECategoryRequest
    ): Promise<PPECategory> {
        const response =
            await apiClient.put<PPECategory>(
                `/ppe-categories/${id}`,
                request
            );

        return response.data;
    },


    async setStatus(
        id: number,
        request: SetPPECategoryStatusRequest
    ): Promise<PPECategory> {
        const response =
            await apiClient.put<PPECategory>(
                `/ppe-categories/${id}/status`,
                request
            );

        return response.data;
    },
};