import { apiClient } from "../client";

import type {
    AuthUser,
    LoginRequest,
    LoginResponse,
} from "../../types/types";

export const authService = {
    async login(
        request: LoginRequest
    ): Promise<LoginResponse> {
        const response =
            await apiClient.post<LoginResponse>(
                "/auth/login",
                request
            );

        return response.data;
    },

    async getMe(): Promise<AuthUser> {
        const response =
            await apiClient.get<AuthUser>(
                "/auth/me"
            );

        return response.data;
    },
};