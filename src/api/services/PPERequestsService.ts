import { apiClient, } from "../client";

import type {
    CancelPPERequestRequest,
    CancelPPERequestResult,
    CreatePPERequestRequest,
    CreatePPERequestResult,
    DeliverPPERequestRequest,
    DeliverPPERequestResult,
    PPERequest,
    PagedResult,
    PPERequestFormOptions,
    RequestablePPEProduct,
    PendingApprovalPPERequest,
    ApprovePPERequestResult,
    RejectPPERequestRequest,
    RejectPPERequestResult,
    PendingPPERequest,
    GetPendingPPERequestsParams,
} from "../../types/types";

export const ppeRequestsService = {
    async getPendingApproval(pageNumber = 1, pageSize = 25): Promise<PagedResult<PendingApprovalPPERequest>> {
        const response = await apiClient.get<PagedResult<PendingApprovalPPERequest>>(
            "/ppe-requests/pending-approval",
            { params: { pageNumber, pageSize } }
        );
        return response.data;
    },

    async approve(folio: string): Promise<ApprovePPERequestResult> {
        const response = await apiClient.post<ApprovePPERequestResult>(
            `/ppe-requests/${encodeURIComponent(folio)}/approve`
        );
        return response.data;
    },

    async reject(folio: string, rejectionReason: string): Promise<RejectPPERequestResult> {
        const request: RejectPPERequestRequest = { rejectionReason };
        const response = await apiClient.post<RejectPPERequestResult>(
            `/ppe-requests/${encodeURIComponent(folio)}/reject`,
            request
        );
        return response.data;
    },

    async getFormOptions(): Promise<PPERequestFormOptions> {
        const response = await apiClient.get<PPERequestFormOptions>("/ppe-requests/form-options");
        return response.data;
    },

    async getRequestableProducts(warehouseId: number): Promise<RequestablePPEProduct[]> {
        const response = await apiClient.get<RequestablePPEProduct[]>(
            "/ppe-requests/requestable-products",
            { params: { warehouseId } }
        );
        return response.data;
    },

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
        params: GetPendingPPERequestsParams = {}
    ): Promise<PagedResult<PendingPPERequest>> {
        const response =
            await apiClient.get<
                PagedResult<PendingPPERequest>
            >(
                "/ppe-requests/pending",
                {
                    params,
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
        employeeNumber: string,
        pageNumber = 1,
        pageSize = 25
    ): Promise<PagedResult<PPERequest>> {
        const response =
            await apiClient.get<
                PagedResult<PPERequest>
            >(
                "/ppe-requests/history",
                {
                    params: {
                        employeeNumber,
                        pageNumber,
                        pageSize,
                    },
                }
            );

        return response.data;
    },

};

