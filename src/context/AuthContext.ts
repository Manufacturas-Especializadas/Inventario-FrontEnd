import {
    createContext,
} from "react";

import type {
    AuthUser,
    LoginRequest,
    UserRole,
} from "../types/types";

export interface AuthContextValue {
    user: AuthUser | null;

    isAuthenticated: boolean;

    isLoading: boolean;

    login: (
        credentials: LoginRequest
    ) => Promise<void>;

    logout: () => void;

    hasRole: (
        role: UserRole
    ) => boolean;

    hasAnyRole: (
        roles: UserRole[]
    ) => boolean;
}

export const AuthContext =
    createContext<
        AuthContextValue | undefined
    >(undefined);