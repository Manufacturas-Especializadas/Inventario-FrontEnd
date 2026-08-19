import {
    Navigate,
    Route,
    Routes,
} from "react-router";

import {
    AppLayout,
} from "../layouts/AppLayout";

import {
    DashboardPage,
} from "../pages/DashboardPage";

import {
    LoginPage,
} from "../pages/LoginPage";

import {
    ModulePlaceholderPage,
} from "../pages/ModulePlaceholderPage";

import {
    UnauthorizedPage,
} from "../pages/UnauthorizedPage";

import {
    ProtectedRoute,
} from "./ProtectedRoute";

import {
    PPECategoriesPage,
} from "../pages/PPECategoriesPage";

import {
    PPEProductsPage,
} from "../pages/PPEProductsPage";

import {
    SuppliersPage,
} from "../pages/SuppliersPage";

import {
    ProductSuppliersPage,
} from "../pages/ProductSuppliersPage";

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Public */}
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

            {/* Authenticated application */}
            <Route
                element={
                    <ProtectedRoute />
                }
            >
                <Route
                    element={
                        <AppLayout />
                    }
                >
                    <Route
                        index
                        element={
                            <DashboardPage />
                        }
                    />

                    <Route
                        path="ppe-categories"
                        element={
                            <PPECategoriesPage />
                        }
                    />

                    <Route
                        path="ppe-products"
                        element={
                            <PPEProductsPage />
                        }
                    />

                    <Route
                        path="inventory"
                        element={
                            <ModulePlaceholderPage
                                title="Inventario"
                                description="Consulta de existencias, reservas, disponibilidad, bajo stock y movimientos."
                            />
                        }
                    />

                    {/* Production */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrator",
                                    "Production",
                                ]}
                            />
                        }
                    >
                        <Route
                            path="purchase-orders"
                            element={
                                <ModulePlaceholderPage
                                    title="Órdenes de compra"
                                    description="Creación y consulta de órdenes de compra de EPP."
                                />
                            }
                        />

                        <Route
                            path="ppe-requests"
                            element={
                                <ModulePlaceholderPage
                                    title="Solicitudes EPP"
                                    description="Creación y seguimiento de solicitudes de equipo para empleados."
                                />
                            }
                        />
                    </Route>

                    {/* Warehouse */}
                    <Route
                        element={
                            <ProtectedRoute
                                allowedRoles={[
                                    "Administrator",
                                    "Warehouse",
                                ]}
                            />
                        }
                    >
                        <Route
                            path="receiving"
                            element={
                                <ModulePlaceholderPage
                                    title="Recepción de material"
                                    description="Recepción de órdenes de compra y entrada de material al inventario."
                                />
                            }
                        />

                        <Route
                            path="deliveries"
                            element={
                                <ModulePlaceholderPage
                                    title="Entregas"
                                    description="Entrega de EPP reservado a los empleados."
                                />
                            }
                        />

                        <Route
                            path="inventory-counts"
                            element={
                                <ModulePlaceholderPage
                                    title="Conteos físicos"
                                    description="Captura y revisión de conteos físicos del inventario."
                                />
                            }
                        />
                    </Route>

                    {/* Administrator */}
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
                            path="product-suppliers"
                            element={
                                <ProductSuppliersPage />
                            }
                        />

                        <Route
                            path="suppliers"
                            element={
                                <SuppliersPage />
                            }
                        />

                        <Route
                            path="admin"
                            element={
                                <ModulePlaceholderPage
                                    title="Administración"
                                    description="Usuarios, auditoría, configuraciones y operaciones administrativas."
                                />
                            }
                        />
                    </Route>
                </Route>
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