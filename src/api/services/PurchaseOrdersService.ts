import {
    apiClient,
} from "../client";

import type {
    CreatePurchaseOrderRequest,
    CancelPurchaseOrderRequest,
    PurchaseOrder,
    UpdatePurchaseOrderRequest,
    Warehouse,
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

    async update(
        folio: string,
        request: UpdatePurchaseOrderRequest
    ): Promise<PurchaseOrder> {
        const response =
            await apiClient.put<PurchaseOrder>(
                `/purchase-orders/${encodeURIComponent(
                    folio
                )}`,
                request
            );

        return response.data;
    },

    async cancel(
        folio: string,
        request: CancelPurchaseOrderRequest
    ): Promise<PurchaseOrder> {
        const response =
            await apiClient.put<PurchaseOrder>(
                `/purchase-orders/${encodeURIComponent(
                    folio
                )}/cancel`,
                request
            );

        return response.data;
    },

    async getReceivingWarehouses(
        folio: string
    ): Promise<Warehouse[]> {
        const response =
            await apiClient.get<Warehouse[]>(
                `/purchase-orders/${encodeURIComponent(
                    folio
                )}/receiving-warehouses`
            );

        return response.data;
    },
};