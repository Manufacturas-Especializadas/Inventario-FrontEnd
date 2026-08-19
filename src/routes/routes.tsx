import {
    Navigate,
    Route,
    Routes,
} from "react-router";

import {
    AdminPage,
} from "../pages/AdminPage";

import {
    HomePage,
} from "../pages/HomePage";

import {
    LoginPage,
} from "../pages/LoginPage";

import {
    UnauthorizedPage,
} from "../pages/UnauthorizedPage";

import {
    ProtectedRoute,
} from "./ProtectedRoute";

export const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <LoginPage />
                }
            />

            <Route
                path="/unauthorized"
                element={
                    <UnauthorizedPage />
                }
            />

            <Route
                element={
                    <ProtectedRoute />
                }
            >
                <Route
                    path="/"
                    element={
                        <HomePage />
                    }
                />
            </Route>

            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            "Administrator",
                        ]}
                    />
                }
            >
                <Route
                    path="/admin"
                    element={
                        <AdminPage />
                    }
                />
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/"
                        replace
                    />
                }
            />
        </Routes>
    );
};