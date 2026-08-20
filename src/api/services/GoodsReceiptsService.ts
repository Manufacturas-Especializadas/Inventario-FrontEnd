import {
    apiClient,
} from "../client";

import type {
    GoodsReceipt,
    ReceivePurchaseOrderRequest,
} from "../../types/types";

export const goodsReceiptsService = {
    async receive(
        request: ReceivePurchaseOrderRequest
    ): Promise<GoodsReceipt> {
        const response =
            await apiClient.post<GoodsReceipt>(
                "/goods-receipts",
                request
            );

        return response.data;
    },
};