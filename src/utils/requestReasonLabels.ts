import type { RequestReasonCode } from "../types/types";

const requestReasonLabels: Record<RequestReasonCode, string> = {
    INITIAL_ASSIGNMENT: "Asignación inicial",
    SCHEDULED_REPLACEMENT: "Reemplazo programado",
    WEAR: "Desgaste",
    DAMAGE: "Daño",
    LOST: "Pérdida",
    JOB_CHANGE: "Cambio de puesto",
    OTHER: "Otro",
};

const normalize = (value: string) => value.trim().toUpperCase().replace(/[\s_-]+/g, "");
const knownLabels = new Map(
    Object.entries(requestReasonLabels).map(([code, label]) => [normalize(code), label])
);
// Names used by older responses without requestReasonCode.
knownLabels.set("LOSS", requestReasonLabels.LOST);
knownLabels.set("WEARANDTEAR", requestReasonLabels.WEAR);

export const getRequestReasonLabel = (value: string | null | undefined, code?: string | null): string => {
    const source = code?.trim() ? code : value;
    if (!source?.trim()) return "Sin motivo";
    return knownLabels.get(normalize(source)) ?? source;
};
