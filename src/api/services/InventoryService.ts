import { apiClient } from "../client";

import type {
    InventoryBalance,
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

};
