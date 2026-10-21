import type { UserRole } from "../types/types";

const roleLabels: Record<UserRole, string> = {
    Administrator: "Administrador",
    Production: "Solicitante EPP",
    Warehouse: "Almacén",
    Viewer: "Consulta",
};

export const getRoleLabel = (role: UserRole): string => roleLabels[role] ?? role;
