import { apiClient } from "../client";
import type { DashboardSummary } from "../../types/types";

export const dashboardService = {
    async getSummary(signal?: AbortSignal): Promise<DashboardSummary> {
        const response = await apiClient.get<DashboardSummary>("/dashboard/summary", { signal });
        return response.data;
    },
};
