import {
    apiClient,
} from "../client";

import type {
    CreateInventoryAdjustmentRequest,
    InventoryAdjustment,
} from "../../types/types";


export const inventoryAdjustmentsService = {
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