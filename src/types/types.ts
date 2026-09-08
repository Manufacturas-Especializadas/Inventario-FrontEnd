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

    defaultMaxQuantityPerCycle: number | null;

    replacementIntervalDays: number | null;

    isActive: boolean;

    createdAt: string;
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

    defaultMaxQuantityPerCycle?: number | null;

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

//Inventario cantidades estatus 
export interface InventoryBalance {
    warehouseId: number;
    warehouseCode: string;
    warehouseName: string;

    ppeProductId: number;
    sku: string;
    productName: string;
    categoryName: string;

    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;

    minimumStock: number;
    isLowStock: boolean;
}

export interface LowStock {
    warehouseId: number;
    warehouseCode: string;
    warehouseName: string;

    ppeProductId: number;
    sku: string;
    productName: string;
    categoryName: string;

    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;

    minimumStock: number;
    shortageQuantity: number;
}

// EMPLEADOS

export interface Employee {
    id: number;
    employeeNumber: string;
    name: string;

    departmentId: number | null;
    departmentName: string | null;

    lineId: number | null;
    lineName: string | null;

    organizationalUnitId: number | null;
    organizationalUnitName: string | null;
    organizationalUnitType: OrganizationalUnitType | null;

    isActive: boolean;
    createdAt: string;
}


// UNIDADES ORGANIZACIONALES

export type OrganizationalUnitType =
    | 1 // Department
    | 2 // Area
    | 3 // Line
    | 4 // Subarea
    | 5; // Team

export interface OrganizationalUnit {
    id: number;
    name: string;
    description: string | null;
    type: OrganizationalUnitType;

    parentId: number | null;
    parentName: string | null;

    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}


// MOTIVOS DE SOLICITUD

export type RequestReasonCode =
    | "INITIAL_ASSIGNMENT"
    | "SCHEDULED_REPLACEMENT"
    | "WEAR"
    | "DAMAGE"
    | "LOST"
    | "JOB_CHANGE"
    | "OTHER";

export interface RequestReason {
    id: number;
    code: RequestReasonCode;
    name: string;
    description: string | null;
}


// PPE REQUESTS

export type PPERequestStatus =
    | 1 // Pending
    | 2 // Delivered
    | 3; // Cancelled

export interface PPERequestItem {
    ppeProductId: number;
    sku: string;
    productName: string;
    quantity: number;
    replacementIntervalDays: number | null;
}

export interface PPERequest {
    id: number;
    folio: string;
    status: PPERequestStatus;

    employeeId: number;
    employeeNumber: string;
    employeeName: string;

    requestedForOrganizationalUnitId: number | null;
    requestedForOrganizationalUnitName: string | null;

    warehouseId: number;
    warehouseName: string;

    requestReasonId: number;
    requestReason: string;

    notes: string | null;

    createdAt: string;
    deliveredAt: string | null;
    cancelledAt: string | null;
    cancellationReason: string | null;

    items: PPERequestItem[];
}


// CREAR PPE REQUEST

export interface CreatePPERequestItemRequest {
    ppeProductId: number;
    quantity: number;
}

export interface CreatePPERequestRequest {
    employeeNumber: string;
    requestedForOrganizationalUnitId: number;
    warehouseId: number;
    requestReasonId: number;
    notes?: string | null;
    items: CreatePPERequestItemRequest[];
}


// RESPUESTA AL CREAR PPE REQUEST

export interface PPERequestWarning {
    code: string;
    ppeProductId: number;
    sku: string;
    productName: string;
    lastDeliveredAt: string;
    nextEligibleDate: string;
    message: string;
}

export interface CreatePPERequestResult {
    request: PPERequest;
    warnings: PPERequestWarning[];
}

export interface CancelPPERequestRequest {
    cancellationReason: string;
}

export interface CancelledPPEItem {
    ppeProductId: number;
    sku: string;
    productName: string;

    releasedQuantity: number;

    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
}

export interface CancelPPERequestResult {
    ppeRequestId: number;
    folio: string;

    employeeNumber: string;
    employeeName: string;

    cancelledAt: string;
    cancellationReason: string;

    items: CancelledPPEItem[];
}
