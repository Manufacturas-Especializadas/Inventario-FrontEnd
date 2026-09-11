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

// ADMINISTRACIÓN DE USUARIOS

export interface AdminUser {
    id: number;

    employeeId: number;
    employeeNumber: string;
    employeeName: string;

    username: string;

    roles: UserRole[];

    isActive: boolean;
    employeeIsActive: boolean;

    lastLoginAt: string | null;

    createdAt: string;
    updatedAt: string | null;
}


export interface CreateUserRequest {
    employeeNumber: string;
    username: string;
    password: string;
    roles: UserRole[];
}


export interface CreateUserResponse {
    userId: number;
}


export interface UpdateUserRequest {
    username: string;
}


export interface SetUserRolesRequest {
    roles: UserRole[];
}


export interface ResetUserPasswordRequest {
    newPassword: string;
}


export interface SetUserStatusRequest {
    isActive: boolean;
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

// EPP CATEGORÍAS

export interface PPECategory {
    id: number;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;

    // El backend actual no lo devuelve todavía.
    updatedAt?: string | null;
}

export interface CreatePPECategoryRequest {
    name: string;
    description?: string | null;
}

export interface UpdatePPECategoryRequest {
    name: string;
    description?: string | null;
}

export interface SetPPECategoryStatusRequest {
    isActive: boolean;
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

    stockUnitId: number;
    stockUnit: string;
    stockUnitSymbol: string | null;

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

    stockUnitId: number;

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

    purchaseUnitId: number;
    purchaseUnit: string;
    purchaseUnitSymbol: string | null;

    unitsPerPackage: number;

    packageBarcode: string | null;

    isPreferred: boolean;
    isActive: boolean;
}

export interface CreateProductSupplierRequest {
    ppeProductId: number;
    supplierId: number;

    supplierProductCode?: string | null;

    purchaseUnitId: number;
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

export interface CreateEmployeeRequest {
    employeeNumber: string;
    name: string;
    organizationalUnitId: number;
}

export interface UpdateEmployeeRequest {
    id: number;
    employeeNumber: string;
    name: string;
    organizationalUnitId: number;
}

export interface SetEmployeeStatusRequest {
    isActive: boolean;
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

export interface DeliverPPERequestRequest {
    employeeNumber: string;
}

export interface DeliveredPPEItem {
    ppeProductId: number;
    sku: string;
    productName: string;

    deliveredQuantity: number;

    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
}

export interface DeliverPPERequestResult {
    ppeRequestId: number;
    folio: string;

    employeeNumber: string;
    employeeName: string;

    warehouseId: number;
    warehouseName: string;

    deliveredAt: string;

    items: DeliveredPPEItem[];
}

// CONTEOS FÍSICOS

export type InventoryCountStatus =
    | 1 // Draft
    | 2 // PendingReview
    | 3 // Posted
    | 4; // Cancelled

export interface InventoryCountItem {
    id: number;

    ppeProductId: number;

    sku: string;
    productName: string;
    categoryName: string;

    countedQuantity: number | null;

    systemQuantity: number | null;
    variance: number | null;

    countedAt: string | null;
}

export interface InventoryCount {
    id: number;

    folio: string;

    warehouseId: number;
    warehouseCode: string;
    warehouseName: string;

    status: InventoryCountStatus;

    notes: string | null;

    createdAt: string;

    submittedAt: string | null;
    postedAt: string | null;

    items: InventoryCountItem[];
}

export interface StartInventoryCountRequest {
    warehouseId: number;
    notes?: string | null;
}

export interface CaptureInventoryCountItemRequest {
    countedQuantity: number;
}

// AJUSTES MANUALES DE INVENTARIO

export interface InventoryAdjustmentItem {
    ppeProductId: number;

    sku: string;
    productName: string;

    quantityAdjustment: number;

    previousOnHandQuantity: number;
    newOnHandQuantity: number;

    reservedQuantity: number;
    availableQuantity: number;
}

export interface InventoryAdjustment {
    id: number;

    folio: string;

    warehouseId: number;
    warehouseCode: string;
    warehouseName: string;

    reason: string;

    createdByUserId: number;
    createdAt: string;

    items: InventoryAdjustmentItem[];
}

export interface CreateInventoryAdjustmentItemRequest {
    ppeProductId: number;
    quantityAdjustment: number;
}

export interface CreateInventoryAdjustmentRequest {
    warehouseId: number;
    reason: string;
    items: CreateInventoryAdjustmentItemRequest[];
}
export interface CreateOrganizationalUnitRequest {
    name: string;
    description?: string | null;
    type: OrganizationalUnitType;
    parentId?: number | null;
}


// LÍMITES EPP POR UNIDAD ORGANIZACIONAL

export interface OrganizationalUnitPPELimit {
    id: number;

    organizationalUnitId: number;
    organizationalUnitName: string;

    ppeProductId: number;
    sku: string;
    productName: string;

    maxQuantityPerCycle: number;

    isActive: boolean;

    createdAt: string;
    updatedAt: string | null;
}


export interface SetOrganizationalUnitPPELimitRequest {
    organizationalUnitId: number;
    ppeProductId: number;

    maxQuantityPerCycle: number;

    isActive: boolean;
}

// AUDITORÍA

export interface AuditLog {
    id: number;

    entityName: string;
    entityId: string;

    action: string;
    description: string | null;

    oldValuesJson: string | null;
    newValuesJson: string | null;

    performedByUserId: number;
    performedByUsername: string;
    performedByEmployeeName: string;

    createdAt: string;
}


export interface PagedResult<T> {
    items: T[];

    pageNumber: number;
    pageSize: number;

    totalCount: number;
    totalPages: number;

    hasPreviousPage: boolean;
    hasNextPage: boolean;
}


export interface GetAuditLogsParams {
    entityName?: string | null;

    performedByUserId?: number | null;

    dateFrom?: string | null;
    dateTo?: string | null;

    pageNumber?: number;
    pageSize?: number;
}

export interface UnitOfMeasure {
    id: number;
    name: string;
    symbol: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string | null;
}

export interface CreateUnitOfMeasureRequest {
    name: string;
    symbol?: string | null;
}

export interface UpdateUnitOfMeasureRequest {
    name: string;
    symbol?: string | null;
}

export interface SetUnitOfMeasureStatusRequest {
    isActive: boolean;
}