import { apiClient } from "../client";

import type {
    CreateSupplierRequest,
    SetSupplierStatusRequest,
    Supplier,
    UpdateSupplierRequest,
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

    async update(
        id: number,
        request: UpdateSupplierRequest
    ): Promise<Supplier> {
        const response =
            await apiClient.put<Supplier>(
                `/suppliers/${id}`,
                request
            );

        return response.data;
    },

    async setStatus(
        id: number,
        request: SetSupplierStatusRequest
    ): Promise<Supplier> {
        const response =
            await apiClient.put<Supplier>(
                `/suppliers/${id}/status`,
                request
            );

        return response.data;
    },
};
