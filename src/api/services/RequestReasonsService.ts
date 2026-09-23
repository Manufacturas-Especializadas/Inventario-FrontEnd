import {
    apiClient,
} from "../client";

import type {
    RequestReason,
} from "../../types/types";

export const requestReasonsService = {
    async getAll(): Promise<RequestReason[]> {
        const response =
            await apiClient.get<RequestReason[]>(
                "/request-reasons"
            );

        return response.data;
    },
};