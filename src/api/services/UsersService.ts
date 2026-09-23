import {
    apiClient,
} from "../client";

import type {
    AdminUser,
    CreateUserRequest,
    CreateUserResponse,
    ResetUserPasswordRequest,
    SetUserRolesRequest,
    SetUserStatusRequest,
    UpdateUserRequest,
} from "../../types/types";


export const usersService = {
    async getAll():
        Promise<AdminUser[]> {
        const response =
            await apiClient.get<
                AdminUser[]
            >(
                "/users"
            );

        return response.data;
    },


    async getById(
        id: number
    ): Promise<AdminUser> {
        const response =
            await apiClient.get<
                AdminUser
            >(
                `/users/${id}`
            );

        return response.data;
    },


    async create(
        request:
            CreateUserRequest
    ): Promise<CreateUserResponse> {
        const response =
            await apiClient.post<
                CreateUserResponse
            >(
                "/users",
                request
            );

        return response.data;
    },


    async update(
        id: number,
        request:
            UpdateUserRequest
    ): Promise<AdminUser> {
        const response =
            await apiClient.put<
                AdminUser
            >(
                `/users/${id}`,
                request
            );

        return response.data;
    },


    async setRoles(
        id: number,
        request:
            SetUserRolesRequest
    ): Promise<AdminUser> {
        const response =
            await apiClient.put<
                AdminUser
            >(
                `/users/${id}/roles`,
                request
            );

        return response.data;
    },


    async resetPassword(
        id: number,
        request:
            ResetUserPasswordRequest
    ): Promise<AdminUser> {
        const response =
            await apiClient.put<
                AdminUser
            >(
                `/users/${id}/password`,
                request
            );

        return response.data;
    },


    async setStatus(
        id: number,
        request:
            SetUserStatusRequest
    ): Promise<AdminUser> {
        const response =
            await apiClient.put<
                AdminUser
            >(
                `/users/${id}/status`,
                request
            );

        return response.data;
    },
};