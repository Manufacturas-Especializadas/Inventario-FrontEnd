import {
    apiClient,
} from "../client";

import type {
    CreateInventoryAdjustmentRequest,
    InventoryAdjustment,
    InventoryAdjustmentFilters,
    InventoryAdjustmentSummary,
} from "../../types/types";


export const inventoryAdjustmentsService = {
    async getList(filters: InventoryAdjustmentFilters = {}): Promise<InventoryAdjustmentSummary[]> {
        const params: InventoryAdjustmentFilters = {};
        if (filters.warehouseId) params.warehouseId = filters.warehouseId;
        if (filters.dateFrom) params.dateFrom = filters.dateFrom;
        if (filters.dateTo) params.dateTo = filters.dateTo;
        const response = await apiClient.get<InventoryAdjustmentSummary[]>("/inventory-adjustments", { params });
        return response.data;
    },

    async create(
        request:
            CreateInventoryAdjustmentRequest
    ): Promise<InventoryAdjustment> {
        const response =
            await apiClient.post<
                InventoryAdjustment
            >(
                "/inventory-adjustments",
                request
            );

        return response.data;
    },


    async getByFolio(
        folio: string
    ): Promise<InventoryAdjustment> {
        const response =
            await apiClient.get<
                InventoryAdjustment
            >(
                `/inventory-adjustments/${encodeURIComponent(
                    folio
                )}`
            );

        return response.data;
    },
};
