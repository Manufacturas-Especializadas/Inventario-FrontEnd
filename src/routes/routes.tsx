import {
    lazy,
    Suspense,
} from "react";

import {
    Navigate,
    Route,
    Routes,
} from "react-router";

import {
    AppLayout,
} from "../layouts/AppLayout";

import {
    ProtectedRoute,
} from "./ProtectedRoute";

const DashboardPage = lazy(() =>
    import("../pages/DashboardPage").then((module) => ({
        default: module.DashboardPage,
    }))
);

const LoginPage = lazy(() =>
    import("../pages/LoginPage").then((module) => ({
        default: module.LoginPage,
    }))
);

const ModulePlaceholderPage = lazy(() =>
    import("../pages/ModulePlaceholderPage").then((module) => ({
        default: module.ModulePlaceholderPage,
    }))
);

const UnauthorizedPage = lazy(() =>
    import("../pages/UnauthorizedPage").then((module) => ({
        default: module.UnauthorizedPage,
    }))
);

const PPECategoriesPage = lazy(() =>
    import("../pages/PPECategoriesPage").then((module) => ({
        default: module.PPECategoriesPage,
    }))
);

const PPEProductsPage = lazy(() =>
    import("../pages/PPEProductsPage").then((module) => ({
        default: module.PPEProductsPage,
    }))
);

const SuppliersPage = lazy(() =>
    import("../pages/SuppliersPage").then((module) => ({
        default: module.SuppliersPage,
    }))
);

const ProductSuppliersPage = lazy(() =>
    import("../pages/ProductSuppliersPage").then((module) => ({
        default: module.ProductSuppliersPage,
    }))
);

const WarehousesPage = lazy(() =>
    import("../pages/WarehousesPage").then((module) => ({
        default: module.WarehousesPage,
    }))
);

const PurchaseOrdersPage = lazy(() =>
    import("../pages/PurchaseOrdersPage").then((module) => ({
        default: module.PurchaseOrdersPage,
    }))
);

const ReceivingPage = lazy(() =>
    import("../pages/ReceivingPage").then((module) => ({
        default: module.ReceivingPage,
    }))
);

const InventoryPage = lazy(() =>
    import("../pages/InventoryPage").then((module) => ({
        default: module.InventoryPage,
    }))
);

const PPERequestsPage = lazy(() =>
    import("../pages/PPERequestsPage").then((module) => ({
        default: module.PPERequestsPage,
    }))
);

const DeliveriesPage = lazy(() =>
    import("../pages/DeliveriesPage").then((module) => ({
        default: module.DeliveriesPage,
    }))
);

const InventoryCountsPage = lazy(() =>
    import("../pages/InventoryCountsPage").then((module) => ({
        default: module.InventoryCountsPage,
    }))
);

const InventoryAdjustmentsPage = lazy(() =>
    import("../pages/InventoryAdjustmentsPage").then((module) => ({
        default: module.InventoryAdjustmentsPage,
    }))
);

const OrganizationalUnitsPage = lazy(() =>
    import("../pages/OrganizationalUnitsPage").then((module) => ({
        default: module.OrganizationalUnitsPage,
    }))
);

const AuditLogsPage = lazy(() =>
    import("../pages/AuditLogsPage").then((module) => ({
        default: module.AuditLogsPage,
    }))
);

const EmployeesPage = lazy(() =>
    import("../pages/EmployeesPage").then((module) => ({
        default: module.EmployeesPage,
    }))
);

const UsersPage = lazy(() =>
    import("../pages/UsersPage").then((module) => ({
        default: module.UsersPage,
    }))
);

const UnitsPage = lazy(() =>
    import("../pages/UnitsPage").then((module) => ({
        default: module.UnitsPage,
    }))
);

const SizesPage = lazy(() =>
    import("../pages/SizesPage").then((module) => ({
        default: module.SizesPage,
    }))
);

const ColorsPage = lazy(() =>
    import("../pages/ColorsPage").then((module) => ({
        default: module.ColorsPage,
    }))
);

export const AppRoutes = () => {
    return (
        <Routes>
            {/* Public */}
            <Route
                path="/login"
                element={
                    <Suspense
                        fallback={
                            <div role="status" className="p-6 text-sm text-slate-500">
                                Cargando módulo...
                            </div>
                        }
                    >
                        <LoginPage />
                    </Suspense>
                }
            />

            <Route
                path="/unauthorized"
                element={
                    <Suspense
                        fallback={
                            <div role="status" className="p-6 text-sm text-slate-500">
                                Cargando módulo...
                            </div>
                        }
                    >
                        <UnauthorizedPage />
                    </Suspense>
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
                            path="sizes"
                            element={
                                <SizesPage />
                            }
                        />

                        <Route
                            path="colors"
                            element={
                                <ColorsPage />
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
