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

import {
    WarehousesPage,
} from "../pages/WarehousesPage";

import {
    PurchaseOrdersPage,
} from "../pages/PurchaseOrdersPage";

import {
    ReceivingPage,
} from "../pages/ReceivingPage";

import {
    InventoryPage,
} from "../pages/InventoryPage";
import { PPERequestsPage } from "../pages/PPERequestsPage";
import {
    DeliveriesPage,
} from "../pages/DeliveriesPage";
import { InventoryCountsPage } from "../pages/InventoryCountsPage";
import {
    InventoryAdjustmentsPage,
} from "../pages/InventoryAdjustmentsPage";
import {
    OrganizationalUnitsPage,
} from "../pages/OrganizationalUnitsPage";
import {
    AuditLogsPage,
} from "../pages/AuditLogsPage";
import {
    EmployeesPage,
} from "../pages/EmployeesPage";
import {
    UsersPage,
} from "../pages/UsersPage";
import {
    UnitsPage,
} from "../pages/UnitsPage";

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
                            <InventoryPage />
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
                                <PurchaseOrdersPage />
                            }
                        />

                        <Route
                            path="ppe-requests"
                            element={
                                <PPERequestsPage />
                            }
                        />

                        <Route
                            path="employees"
                            element={
                                <EmployeesPage />
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
                                <ReceivingPage />
                            }
                        />

                        <Route
                            path="deliveries"
                            element={
                                <DeliveriesPage />
                            }
                        />

                        <Route
                            path="inventory-counts"
                            element={
                                <InventoryCountsPage />
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
                            path="units"
                            element={
                                <UnitsPage />
                            }
                        />

                        <Route
                            path="suppliers"
                            element={
                                <SuppliersPage />
                            }
                        />

                        <Route
                            path="warehouses"
                            element={
                                <WarehousesPage />
                            }
                        />

                        <Route
                            path="inventory-adjustments"
                            element={
                                <InventoryAdjustmentsPage />
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

                        <Route
                            path="organizational-units"
                            element={
                                <OrganizationalUnitsPage />
                            }
                        />

                        <Route
                            path="audit-logs"
                            element={
                                <AuditLogsPage />
                            }
                        />

                        <Route
                            path="users"
                            element={
                                <UsersPage />
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