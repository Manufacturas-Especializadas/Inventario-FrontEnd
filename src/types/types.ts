export type UserRole =
    | "Administrator"
    | "Production"
    | "Warehouse"
    | "Viewer";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    expiresAt?: string;
}

export interface AuthUser {
    userId: number;
    employeeId: number;
    employeeNumber: string;
    name: string;
    username: string;
    roles: UserRole[];
}

export interface ApiProblemDetails {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    message?: string;

    errors?: Record<string, string[]>;
}