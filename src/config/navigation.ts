import type {
    UserRole,
} from "../types/types";

export type NavigationGroupId =
    | "catalog"
    | "purchasing"
    | "inventory"
    | "requests"
    | "people"
    | "administration";

export const navigationGroups: {
    id: NavigationGroupId;
    label: string;
}[] = [
        { id: "catalog", label: "Catálogo" },
        { id: "purchasing", label: "Abastecimiento" },
        { id: "inventory", label: "Inventario" },
        { id: "requests", label: "Solicitudes y entregas" },
        { id: "people", label: "Personal" },
        { id: "administration", label: "Administración" },
    ];

export interface NavigationItem {
    label: string;
    path: string;
    roles?: UserRole[];
    group?: NavigationGroupId;
}

export const navigationItems: NavigationItem[] = [
    {
        label: "Dashboard",
        path: "/",
    },

    {
        label: "Categorías",
        path: "/ppe-categories",
        group: "catalog",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Unidades de medida",
        path: "/units",
        group: "catalog",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Productos",
        path: "/ppe-products",
        group: "catalog",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Proveedores",
        path: "/suppliers",
        group: "purchasing",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Productos por proveedor",
        path: "/product-suppliers",
        group: "purchasing",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Órdenes de compra",
        path: "/purchase-orders",
        group: "purchasing",
        roles: [
            "Administrator",
            "Production",
        ],
    },

    {
        label: "Recepción de material",
        path: "/receiving",
        group: "purchasing",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Solicitudes Producto",
        path: "/ppe-requests",
        group: "requests",
        roles: [
            "Administrator",
            "Production",
        ],
    },

    {
        label: "Entregas",
        path: "/deliveries",
        group: "requests",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Inventario",
        path: "/inventory",
        group: "inventory",
    },

    {
        label: "Conteos físicos",
        path: "/inventory-counts",
        group: "inventory",
        roles: [
            "Administrator",
            "Warehouse",
        ],
    },

    {
        label: "Almacenes",
        path: "/warehouses",
        group: "inventory",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Ajustes de inventario",
        path: "/inventory-adjustments",
        group: "inventory",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Organización y límites",
        path: "/organizational-units",
        group: "people",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Auditoría",
        path: "/audit-logs",
        group: "administration",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Empleados",
        path: "/employees",
        group: "people",
        roles: [
            "Administrator",
            "Production",
        ],
    },

    {
        label: "Usuarios",
        path: "/users",
        group: "administration",
        roles: [
            "Administrator",
        ],
    },

    {
        label: "Administración",
        path: "/admin",
        group: "administration",
        roles: [
            "Administrator",
        ],
    },
];
