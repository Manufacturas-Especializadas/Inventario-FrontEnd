import { useCallback, useEffect, useRef, useState } from "react";
import { unitsService } from "../api/services/unitsService";
import type { UnitOfMeasure } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

interface UseUnitsOptions {
    autoLoad?: boolean;
}

export function useUnits({ autoLoad = true }: UseUnitsOptions = {}) {
    const [units, setUnits] = useState<UnitOfMeasure[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState<string | null>(null);
    const pendingRequest = useRef<Promise<void> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, UnitOfMeasure>());

    const getUnits = useCallback(() => {
        if (pendingRequest.current) {
            return pendingRequest.current;
        }

        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();

        const request = (async () => {
            try {
                const data = await unitsService.getAll();
                // Preserve successful mutations that finished while this GET was pending.
                const merged = new Map(data.map((unit) => [unit.id, unit]));
                updatesDuringLoad.current.forEach((unit) => {
                    merged.set(unit.id, unit);
                });
                setUnits(Array.from(merged.values()));
                setHasLoaded(true);
            } catch (error) {
                setError(getApiErrorMessage(error, "No se pudieron cargar las unidades."));
            } finally {
                setLoading(false);
                pendingRequest.current = null;
                updatesDuringLoad.current.clear();
            }
        })();

        pendingRequest.current = request;
        return request;
    }, []);

    const upsertUnit = useCallback((unit: UnitOfMeasure) => {
        if (pendingRequest.current) {
            updatesDuringLoad.current.set(unit.id, unit);
        }

        setUnits((current) => current.some((entry) => entry.id === unit.id)
            ? current.map((entry) => entry.id === unit.id ? unit : entry)
            : [...current, unit]);
    }, []);

    useEffect(() => {
        if (autoLoad) {
            void getUnits();
        }
    }, [autoLoad, getUnits]);

    const activeUnits = units.filter((unit) => unit.isActive);

    return {
        units,
        activeUnits,
        loading,
        hasLoaded,
        error,
        refresh: getUnits,
        upsertUnit,
    };
}
