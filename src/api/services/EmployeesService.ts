import {
    apiClient,
} from "../client";

import type {
    Employee,
} from "../../types/types";

export const employeesService = {
    async getAll(): Promise<Employee[]> {
        const response =
            await apiClient.get<Employee[]>(
                "/employees"
            );

        return response.data;
    },

    async getByEmployeeNumber(
        employeeNumber: string
    ): Promise<Employee> {
        const response =
            await apiClient.get<Employee>(
                `/employees/by-number/${encodeURIComponent(
                    employeeNumber
                )}`
            );

        return response.data;
    },
};