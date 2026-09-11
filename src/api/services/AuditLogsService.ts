import {
    apiClient,
} from "../client";

import type {
    AuditLog,
    GetAuditLogsParams,
    PagedResult,
} from "../../types/types";


export const auditLogsService = {
    async getAll(
        params?: GetAuditLogsParams
    ): Promise<
        PagedResult<AuditLog>
    > {
        const response =
            await apiClient.get<
                PagedResult<AuditLog>
            >(
                "/audit-logs",
                {
                    params: {
                        entityName:
                            params?.entityName?.trim() ||
                            undefined,

                        performedByUserId:
                            params?.performedByUserId ??
                            undefined,

                        dateFrom:
                            params?.dateFrom ??
                            undefined,

                        dateTo:
                            params?.dateTo ??
                            undefined,

                        pageNumber:
                            params?.pageNumber ??
                            1,

                        pageSize:
                            params?.pageSize ??
                            25,
                    },
                }
            );

        return response.data;
    },
};