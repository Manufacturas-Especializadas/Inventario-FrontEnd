import type {
    UserRole,
} from "../types/types";

export interface NavigationItem {
    label: string;
    path: string;
    roles?: UserRole[];
}

export const navigationItems: NavigationItem[] = [
    {
        label: "Dashboard",
        path: "/",
    },

    {
        label: "Categorías EPP",
        path: "/ppe-categories",
    },

    {
        label: "Productos EPP",
        path: "/ppe-products",
    },

    {
        label: "Proveedores",
        path: "/suppliers",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Productos por proveedor",
        path: "/product-suppliers",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Órdenes de compra",
        path: "/purchase-orders",
        roles: [
            "Administrator",
            "Production",
        ],
    },

    {
        label: "Recepción de material",
        path: "/receiving",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Solicitudes EPP",
        path: "/ppe-requests",
        roles: [
            "Administrator",
            "Production",
        ],
    },

    {
        label: "Entregas",
        path: "/deliveries",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Inventario",
        path: "/inventory",
    },

    {
        label: "Conteos físicos",
        path: "/inventory-counts",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Administración",
        path: "/admin",
        roles: [
            "Administrator",
        ],
    },
];