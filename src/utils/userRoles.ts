import type { UserRole } from "../types/types";

// Administrator always keeps the full administrative experience.
export const isProductionOnly = (roles: readonly UserRole[]): boolean =>
    roles.includes("Production") && !roles.includes("Administrator");
