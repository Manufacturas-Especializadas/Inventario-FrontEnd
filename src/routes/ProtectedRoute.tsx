import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router";

import {
    useAuth,
} from "../hooks/useAuth";

import type {
    UserRole,
} from "../types/types";
import { isProductionOnly } from "../utils/userRoles";

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
    allowedRoles,
}: ProtectedRouteProps) => {
    const {
        isAuthenticated,
        isLoading,
        hasAnyRole,
        user,
    } = useAuth();

    const location =
        useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-sm text-slate-600">
                    Cargando...
                </p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }

    if (
        (isProductionOnly(user?.roles ?? []) && !["/", "/ppe-requests"].includes(location.pathname.replace(/\/+$/, "") || "/")) ||
        (allowedRoles && !hasAnyRole(allowedRoles))
    ) {
        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }

    return <Outlet />;
};
