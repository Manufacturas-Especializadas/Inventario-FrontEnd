import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    organizationalUnitsService,
} from "../api/services/OrganizationalUnitsService";

import type {
    CreateOrganizationalUnitRequest,
    OrganizationalUnit,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface UseOrganizationalUnitsOptions {
    autoLoad?: boolean;
}

export const useOrganizationalUnits =
    ({ autoLoad = true }: UseOrganizationalUnitsOptions = {}) => {
        const [hasLoaded, setHasLoaded] = useState(false);
        const loaded = useRef(false);
        const pendingRequest = useRef<Promise<OrganizationalUnit[]> | null>(null);
        const updatesDuringLoad = useRef(new Map<number, OrganizationalUnit>());
        const pendingCreate = useRef(false);
        const [createError, setCreateError] = useState<string | null>(null);
        const [
            organizationalUnits,
            setOrganizationalUnits,
        ] = useState<
            OrganizationalUnit[]
        >([]);

        const [
            loading,
            setLoading,
        ] = useState(false);

        const [
            creating,
            setCreating,
        ] = useState(false);

        const [
            error,
            setError,
        ] = useState<
            string | null
        >(null);


        const refresh = useCallback((): Promise<OrganizationalUnit[]> => {
            if (pendingRequest.current) return pendingRequest.current;
            setLoading(true);
            setError(null);
            updatesDuringLoad.current.clear();
            const request = (async () => {
                try {
                    const data = await organizationalUnitsService.getAll();
                    const merged = new Map(data.map((unit) => [unit.id, unit]));
                    updatesDuringLoad.current.forEach((unit) => merged.set(unit.id, unit));
                    const result = Array.from(merged.values());
                    setOrganizationalUnits(result);
                    loaded.current = true;
                    setHasLoaded(true);
                    return result;
                } catch (error) {
                    setError(getApiErrorMessage(error, "No fue posible consultar las unidades organizacionales."));
                    return [];
                } finally {
                    setLoading(false);
                    pendingRequest.current = null;
                    updatesDuringLoad.current.clear();
                }
            })();
            pendingRequest.current = request;
            return request;
        }, []);

        const createOrganizationalUnit =
            useCallback(
                async (
                    request:
                        CreateOrganizationalUnitRequest
                ): Promise<
                    OrganizationalUnit | null
                > => {
                    if (pendingCreate.current) return null;
                    pendingCreate.current = true;
                    setCreating(true);
                    setCreateError(null);

                    try {
                        const data =
                            await organizationalUnitsService
                                .create(
                                    request
                                );

                        if (pendingRequest.current) updatesDuringLoad.current.set(data.id, data);
                        // A single creation does not establish a complete list.
                        if (loaded.current) setOrganizationalUnits((current) => [
                            ...current.filter((unit) => unit.id !== data.id), data,
                        ]);

                        return data;
                    } catch (error) {
                        setCreateError(
                            getApiErrorMessage(
                                error,
                                "No fue posible crear la unidad organizacional."
                            )
                        );

                        return null;
                    } finally {
                        pendingCreate.current = false;
                        setCreating(false);
                    }
                },
                []
            );


        useEffect(() => {
            if (autoLoad) void refresh();
        }, [autoLoad, refresh]);


        return {
            organizationalUnits,
            hasLoaded,

            loading,
            creating,

            error,
            createError,

            refresh,
            createOrganizationalUnit,
        };
    };