import {
    apiClient,
} from "../client";

import type {
    CreateUnitOfMeasureRequest,
    SetUnitOfMeasureStatusRequest,
    UnitOfMeasure,
    UpdateUnitOfMeasureRequest,
} from "../../types/types";

export const unitsService = {
    async getAll(): Promise<UnitOfMeasure[]> {
        const response =
            await apiClient.get<UnitOfMeasure[]>(
                "/units"
            );

        return response.data;
    },

    async create(
        request: CreateUnitOfMeasureRequest
    ): Promise<UnitOfMeasure> {
        const response =
            await apiClient.post<UnitOfMeasure>(
                "/units",
                request
            );

        return response.data;
    },

    async update(
        id: number,
        request: UpdateUnitOfMeasureRequest
    ): Promise<UnitOfMeasure> {
        const response =
            await apiClient.put<UnitOfMeasure>(
                `/units/${id}`,
                request
            );

        return response.data;
    },

    async setStatus(
        id: number,
        request: SetUnitOfMeasureStatusRequest
    ): Promise<UnitOfMeasure> {
        const response =
            await apiClient.put<UnitOfMeasure>(
                `/units/${id}/status`,
                request
            );

        return response.data;
    },
};