import axios from "axios";
import { apiConfig } from "../config/api";
import { authStorage } from "../utils/authStorage";

export const apiClient = axios.create({
    baseURL: apiConfig.baseUrl,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token =
            authStorage.getToken();

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,

    (error) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            authStorage.getToken()
        ) {
            authStorage.removeToken();

            if (
                window.location.pathname !==
                "/login"
            ) {
                window.location.assign(
                    "/login"
                );
            }
        }

        return Promise.reject(error);
    }
);