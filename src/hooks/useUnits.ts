import { useCallback, useEffect, useState } from "react";
import { unitsService } from "../api/services/unitsService";
import type { UnitOfMeasure } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

export function useUnits() {
    const [units, setUnits] =
        useState<UnitOfMeasure[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const getUnits = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data =
                await unitsService.getAll();

            setUnits(data);
        } catch (error) {
            setError(
                getApiErrorMessage(
                    error,
                    "No se pudieron cargar las unidades."
                )
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void getUnits();
    }, [getUnits]);

    const activeUnits =
        units.filter((unit) => unit.isActive);

    return {
        units,
        activeUnits,
        loading,
        error,
        refresh: getUnits,
    };
}