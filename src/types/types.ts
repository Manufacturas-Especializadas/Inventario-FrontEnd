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

//Warehouse
export interface Warehouse {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface CreateWarehouseRequest {
    code: string;
    name: string;
    description?: string | null;
}

//Compras admin a proveedor
export type PurchaseOrderStatus = 1 | 2 | 3 | 4;

export interface PurchaseOrderItem {
    id: number;
    ppeProductId: number;

    sku: string;
    productName: string;

    supplierProductCode: string | null;

    purchaseUnit: string;
    unitsPerPackage: number;

    orderedPurchaseQuantity: number;
    orderedStockQuantity: number;

    purchaseUnitCost: number | null;
    lineTotal: number | null;
}

export interface PurchaseOrder {
    id: number;

    folio: string;

    supplierId: number;
    supplierName: string;

    purchaseOrderNumber: string;

    status: PurchaseOrderStatus;

    orderDate: string;
    confirmedDeliveryDate: string;

    supplierConfirmedAt: string | null;

    currencyCode: string;

    notes: string | null;

    createdAt: string;

    items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemRequest {
    ppeProductId: number;
    orderedPurchaseQuantity: number;
    purchaseUnitCost?: number | null;
}

export interface CreatePurchaseOrderRequest {
    supplierId: number;

    purchaseOrderNumber: string;

    confirmedDeliveryDate: string;

    currencyCode: string;

    notes?: string | null;

    items: CreatePurchaseOrderItemRequest[];
}

//Almacen recibe mercancia
export interface ReceivePurchaseOrderRequest {
    purchaseOrderFolio: string;
    warehouseId: number;
    notes?: string | null;
}

export interface GoodsReceiptItem {
    ppeProductId: number;
    sku: string;
    productName: string;
    purchaseUnit: string;
    unitsPerPackage: number;
    orderedPurchaseQuantity: number;
    receivedQuantity: number;
}

export interface GoodsReceipt {
    id: number;
    folio: string;

    purchaseOrderId: number;
    purchaseOrderFolio: string;

    warehouseId: number;
    warehouseName: string;

    supplierId: number;
    supplierName: string;

    receivedAt: string;

    notes: string | null;

    items: GoodsReceiptItem[];
}
