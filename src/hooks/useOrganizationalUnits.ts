import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    organizationalUnitsService,
} from "../api/services/OrganizationalUnitsService";

import type {
    OrganizationalUnit,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const useOrganizationalUnits = () => {
    const [
        organizationalUnits,
        setOrganizationalUnits,
    ] = useState<OrganizationalUnit[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );

    const getOrganizationalUnits =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await organizationalUnitsService
                        .getAll();

                setOrganizationalUnits(
                    data
                );
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar las unidades organizacionales."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        void getOrganizationalUnits();
    }, [getOrganizationalUnits]);

    return {
        organizationalUnits,
        loading,
        error,

        refresh:
            getOrganizationalUnits,
    };
};