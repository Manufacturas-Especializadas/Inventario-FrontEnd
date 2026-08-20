import {
    apiClient,
} from "../client";

import type {
    CreatePurchaseOrderRequest,
    PurchaseOrder,
} from "../../types/types";

export const purchaseOrdersService = {
    async getAll(): Promise<PurchaseOrder[]> {
        const response =
            await apiClient.get<PurchaseOrder[]>(
                "/purchase-orders"
            );

        return response.data;
    },

    async getByFolio(
        folio: string
    ): Promise<PurchaseOrder> {
        const response =
            await apiClient.get<PurchaseOrder>(
                `/purchase-orders/${encodeURIComponent(
                    folio
                )}`
            );

        return response.data;
    },

    async create(
        request: CreatePurchaseOrderRequest
    ): Promise<PurchaseOrder> {
        const response =
            await apiClient.post<PurchaseOrder>(
                "/purchase-orders",
                request
            );

        return response.data;
    },
};