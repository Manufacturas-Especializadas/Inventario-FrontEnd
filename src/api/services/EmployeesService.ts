import {
    apiClient,
} from "../client";

import type {
    CreateEmployeeRequest,
    Employee,
    SetEmployeeStatusRequest,
    UpdateEmployeeRequest,
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


    async create(
        request:
            CreateEmployeeRequest
    ): Promise<Employee> {
        const response =
            await apiClient.post<Employee>(
                "/employees",
                request
            );

        return response.data;
    },


    async update(
        request:
            UpdateEmployeeRequest
    ): Promise<Employee> {
        const response =
            await apiClient.put<Employee>(
                `/employees/${request.id}`,
                request
            );

        return response.data;
    },


    async setStatus(
        employeeId: number,
        request:
            SetEmployeeStatusRequest
    ): Promise<Employee> {
        const response =
            await apiClient.put<Employee>(
                `/employees/${employeeId}/status`,
                request
            );

        return response.data;
    },
};