import { apiClient } from "../client";

import type {
    CaptureInventoryCountItemRequest,
    InventoryCount,
    InventoryCountItem,
    StartInventoryCountRequest,
} from "../../types/types";


export const inventoryCountsService = {
    async getByFolio(
        folio: string
    ): Promise<InventoryCount> {
        const response =
            await apiClient.get<InventoryCount>(
                `/inventory-counts/${encodeURIComponent(
                    folio
                )}`
            );

        return response.data;
    },


    async start(
        request: StartInventoryCountRequest
    ): Promise<InventoryCount> {
        const response =
            await apiClient.post<InventoryCount>(
                "/inventory-counts",
                request
            );

        return response.data;
    },


    async captureItem(
        folio: string,
        ppeProductId: number,
        request:
            CaptureInventoryCountItemRequest
    ): Promise<InventoryCountItem> {
        const response =
            await apiClient.put<InventoryCountItem>(
                `/inventory-counts/${encodeURIComponent(
                    folio
                )}/items/${ppeProductId}`,
                request
            );

        return response.data;
    },


    async submit(
        folio: string
    ): Promise<InventoryCount> {
        const response =
            await apiClient.post<InventoryCount>(
                `/inventory-counts/${encodeURIComponent(
                    folio
                )}/submit`
            );

        return response.data;
    },

    async getPendingReview(): Promise<
        InventoryCount[]
    > {
        const response =
            await apiClient.get<
                InventoryCount[]
            >(
                "/inventory-counts/pending-review"
            );

        return response.data;
    },


    async post(
        folio: string
    ): Promise<InventoryCount> {
        const response =
            await apiClient.post<
                InventoryCount
            >(
                `/inventory-counts/${encodeURIComponent(
                    folio
                )}/post`
            );

        return response.data;
    },
};