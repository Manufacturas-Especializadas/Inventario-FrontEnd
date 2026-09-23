import { apiClient, } from "../client";

import type {
    CancelPPERequestRequest,
    CancelPPERequestResult,
    CreatePPERequestRequest,
    CreatePPERequestResult,
    DeliverPPERequestRequest,
    DeliverPPERequestResult,
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

    async deliver(
        folio: string,
        request: DeliverPPERequestRequest
    ): Promise<DeliverPPERequestResult> {
        const response =
            await apiClient.post<DeliverPPERequestResult>(
                `/ppe-requests/${encodeURIComponent(
                    folio
                )}/deliver`,
                request
            );

        return response.data;
    },

    async getHistory(
        employeeNumber: string
    ): Promise<PPERequest[]> {
        const response =
            await apiClient.get<PPERequest[]>(
                "/ppe-requests/history",
                {
                    params: {
                        employeeNumber,
                    },
                }
            );

        return response.data;
    },

};

