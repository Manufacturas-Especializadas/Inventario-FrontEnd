import { apiClient, } from "../client";

import type {
    CancelPPERequestRequest,
    CancelPPERequestResult,
    CreatePPERequestRequest,
    CreatePPERequestResult,
    PPERequest,
} from "../../types/types";

export const ppeRequestsService = {
    async getByFolio(
        folio: string
    ): Promise<PPERequest> {
        const response =
            await apiClient.get<PPERequest>(
                `/ppe-requests/${encodeURIComponent(
                    folio
                )}`
            );

        return response.data;
    },

    async create(
        request: CreatePPERequestRequest
    ): Promise<CreatePPERequestResult> {
        const response =
            await apiClient.post<CreatePPERequestResult>(
                "/ppe-requests",
                request
            );

        return response.data;
    },


    async getPending(
        warehouseId?: number | null
    ): Promise<PPERequest[]> {
        const response =
            await apiClient.get<PPERequest[]>(
                "/ppe-requests/pending",
                {
                    params:
                        warehouseId
                            ? { warehouseId }
                            : undefined,
                }
            );

        return response.data;
    },

    async cancel(
        folio: string,
        request: CancelPPERequestRequest
    ): Promise<CancelPPERequestResult> {
        const response =
            await apiClient.post<CancelPPERequestResult>(
                `/ppe-requests/${encodeURIComponent(
                    folio
                )}/cancel`,
                request
            );

        return response.data;
    },
};

