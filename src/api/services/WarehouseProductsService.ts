import { apiClient } from "../client";

import type {
    CreateWarehouseProductRequest,
    SetWarehouseProductStatusRequest,
    WarehouseProduct,
    BulkAssignWarehouseProductsRequest,
    BulkAssignWarehouseProductsResult,
} from "../../types/types";


export const warehouseProductsService = {
    async getByWarehouse(
        warehouseId: number
    ): Promise<WarehouseProduct[]> {
        const response =
            await apiClient.get<WarehouseProduct[]>(
                `/warehouse-products/by-warehouse/${warehouseId}`
            );

        return response.data;
    },


    async create(
        request: CreateWarehouseProductRequest
    ): Promise<WarehouseProduct> {
        const response =
            await apiClient.post<WarehouseProduct>(
                "/warehouse-products",
                request
            );

        return response.data;
    },

    async bulkAssign(
        request: BulkAssignWarehouseProductsRequest
    ): Promise<BulkAssignWarehouseProductsResult> {
        const response =
            await apiClient.post<BulkAssignWarehouseProductsResult>(
                "/warehouse-products/bulk-assign",
                request
            );

        return response.data;
    },


    async setStatus(
        warehouseId: number,
        ppeProductId: number,
        request: SetWarehouseProductStatusRequest
    ): Promise<WarehouseProduct> {
        const response =
            await apiClient.put<WarehouseProduct>(
                `/warehouse-products/${warehouseId}/${ppeProductId}/status`,
                request
            );

        return response.data;
    },
};