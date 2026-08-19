import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import { authService } from "../api/services/AuthService";
import { authStorage } from "../utils/authStorage";

import type {
    AuthUser,
    LoginRequest,
    UserRole,
} from "../types/types";

import {
    AuthContext,
} from "./AuthContext";

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({
    children,
}: AuthProviderProps) => {
    const [user, setUser] =
        useState<AuthUser | null>(
            null
        );

    const [isLoading, setIsLoading] =
        useState(true);

    useEffect(() => {
        const initializeAuth =
            async () => {
                const token =
                    authStorage.getToken();

                if (!token) {
                    setIsLoading(false);
                    return;
                }

                try {
                    const currentUser =
                        await authService.getMe();

                    setUser(
                        currentUser
                    );
                } catch {
                    authStorage.removeToken();

                    setUser(
                        null
                    );
                } finally {
                    setIsLoading(false);
                }
            };

        initializeAuth();
    }, []);

    const login =
        useCallback(
            async (
                credentials: LoginRequest
            ) => {
                const loginResponse =
                    await authService.login(
                        credentials
                    );

                if (
                    !loginResponse.token
                ) {
                    throw new Error(
                        "The API did not return an authentication token."
                    );
                }

                authStorage.setToken(
                    loginResponse.token
                );

                try {
                    const currentUser =
                        await authService.getMe();

                    setUser(
                        currentUser
                    );
                } catch (error) {
                    authStorage.removeToken();

                    setUser(
                        null
                    );

                    throw error;
                }
            },
            []
        );

    const logout =
        useCallback(() => {
            authStorage.removeToken();

            setUser(
                null
            );
        }, []);

    const hasRole =
        useCallback(
            (
                role: UserRole
            ): boolean => {
                return (
                    user?.roles.includes(
                        role
                    ) ?? false
                );
            },
            [user]
        );

    const hasAnyRole =
        useCallback(
            (
                roles: UserRole[]
            ): boolean => {
                if (!user) {
                    return false;
                }

                return roles.some(
                    (role) =>
                        user.roles.includes(
                            role
                        )
                );
            },
            [user]
        );

    const value =
        useMemo(
            () => ({
                user,

                isAuthenticated:
                    user !== null,

                isLoading,

                login,

                logout,

                hasRole,

                hasAnyRole,
            }),
            [
                user,
                isLoading,
                login,
                logout,
                hasRole,
                hasAnyRole,
            ]
        );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
};