import { apiClient } from "../client";

import type {
    InventoryBalance,
    LowStock,
} from "../../types/types";

export const inventoryService = {
    async getBalances(
        warehouseId?: number | null
    ): Promise<InventoryBalance[]> {
        const response =
            await apiClient.get<InventoryBalance[]>(
                "/inventory/balances",
                {
                    params:
                        warehouseId
                            ? { warehouseId }
                            : undefined,
                }
            );

        return response.data;
    },

    async getLowStock(
        warehouseId: number
    ): Promise<LowStock[]> {
        const response =
            await apiClient.get<LowStock[]>(
                "/inventory/low-stock",
                {
                    params: {
                        warehouseId,
                    },
                }
            );

        return response.data;
    },
};