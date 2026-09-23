import {
    apiClient,
} from "../client";

import type {
    OrganizationalUnitPPELimit,
    SetOrganizationalUnitPPELimitRequest,
} from "../../types/types";


interface GetLimitsParams {
    organizationalUnitId?:
    number | null;

    ppeProductId?:
    number | null;
}


export const organizationalUnitPPELimitsService = {
    async getAll(
        params?: GetLimitsParams
    ): Promise<
        OrganizationalUnitPPELimit[]
    > {
        const response =
            await apiClient.get<
                OrganizationalUnitPPELimit[]
            >(
                "/organizational-unit-ppe-limits",
                {
                    params: {
                        organizationalUnitId:
                            params?.organizationalUnitId ??
                            undefined,

                        ppeProductId:
                            params?.ppeProductId ??
                            undefined,
                    },
                }
            );

        return response.data;
    },


    async set(
        request:
            SetOrganizationalUnitPPELimitRequest
    ): Promise<
        OrganizationalUnitPPELimit
    > {
        const response =
            await apiClient.put<
                OrganizationalUnitPPELimit
            >(
                "/organizational-unit-ppe-limits",
                request
            );

        return response.data;
    },
};