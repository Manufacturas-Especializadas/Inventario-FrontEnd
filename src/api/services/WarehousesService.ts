import { apiClient } from "../client";

import type {
    CreateWarehouseRequest,
    Warehouse,
} from "../../types/types";

export const warehousesService = {
    async getAll(): Promise<Warehouse[]> {
        const response =
            await apiClient.get<Warehouse[]>(
                "/warehouses"
            );

        return response.data;
    },

    async create(
        request: CreateWarehouseRequest
    ): Promise<Warehouse> {
        const response =
            await apiClient.post<Warehouse>(
                "/warehouses",
                request
            );

        return response.data;
    },
};