import {
    apiClient,
} from "../client";

import type {
    CreateOrganizationalUnitRequest,
    OrganizationalUnit,
} from "../../types/types";


export const organizationalUnitsService = {
    async getAll(): Promise<
        OrganizationalUnit[]
    > {
        const response =
            await apiClient.get<
                OrganizationalUnit[]
            >(
                "/organizational-units"
            );

        return response.data;
    },


    async create(
        request:
            CreateOrganizationalUnitRequest
    ): Promise<OrganizationalUnit> {
        const response =
            await apiClient.post<
                OrganizationalUnit
            >(
                "/organizational-units",
                request
            );

        return response.data;
    },
};