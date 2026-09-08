import {
    apiClient,
} from "../client";

import type {
    OrganizationalUnit,
} from "../../types/types";

export const organizationalUnitsService = {
    async getAll(): Promise<OrganizationalUnit[]> {
        const response =
            await apiClient.get<OrganizationalUnit[]>(
                "/organizational-units"
            );

        return response.data;
    },
};