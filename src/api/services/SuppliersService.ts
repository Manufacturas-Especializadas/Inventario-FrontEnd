import { apiClient } from "../client";

import type {
    CreateSupplierRequest,
    Supplier,
} from "../../types/types";

export const suppliersService = {
    async getAll(): Promise<Supplier[]> {
        const response =
            await apiClient.get<Supplier[]>(
                "/suppliers"
            );

        return response.data;
    },

    async create(
        request: CreateSupplierRequest
    ): Promise<Supplier> {
        const response =
            await apiClient.post<Supplier>(
                "/suppliers",
                request
            );

        return response.data;
    },
};