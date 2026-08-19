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

//EPP CATEGORIAS

export interface PPECategory {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

export interface CreatePPECategoryRequest {
    name: string;
    description?: string | null;
}

export interface PPEProduct {
    id: number;
    sku: string;

    categoryId: number;
    categoryName: string;

    name: string;
    description: string | null;

    size: string | null;
    color: string | null;
    model: string | null;
    specification: string | null;

    stockUnit: string;

    minimumStock: number;

    maxQuantityPerRequest: number | null;

    replacementIntervalDays: number | null;

    isActive: boolean;

    createdAt: string;
    updatedAt: string | null;
}

export interface CreatePPEProductRequest {
    categoryId: number;

    name: string;

    description?: string | null;

    size?: string | null;

    color?: string | null;

    model?: string | null;

    specification?: string | null;

    stockUnit: string;

    minimumStock: number;

    maxQuantityPerRequest?: number | null;

    replacementIntervalDays?: number | null;
}

//PROVEEDORES
export interface Supplier {
    id: number;
    name: string;
    isActive: boolean;
}

export interface CreateSupplierRequest {
    name: string;
}

//Productos proveedor
export interface ProductSupplier {
    ppeProductId: number;
    supplierId: number;

    supplierProductCode: string | null;

    purchaseUnit: string;
    unitsPerPackage: number;

    packageBarcode: string | null;

    isPreferred: boolean;
    isActive: boolean;
}

export interface CreateProductSupplierRequest {
    ppeProductId: number;
    supplierId: number;

    supplierProductCode?: string | null;

    purchaseUnit: string;
    unitsPerPackage: number;

    packageBarcode?: string | null;

    isPreferred: boolean;
}