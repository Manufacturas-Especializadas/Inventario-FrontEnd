import {
    useCallback,
    useEffect,
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


export const useOrganizationalUnits =
    () => {
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


        const refresh =
            useCallback(
                async (): Promise<
                    OrganizationalUnit[]
                > => {
                    setLoading(true);
                    setError(null);

                    try {
                        const data =
                            await organizationalUnitsService
                                .getAll();

                        setOrganizationalUnits(
                            data
                        );

                        return data;
                    } catch (error) {
                        setOrganizationalUnits(
                            []
                        );

                        setError(
                            getApiErrorMessage(
                                error,
                                "No fue posible consultar las unidades organizacionales."
                            )
                        );

                        return [];
                    } finally {
                        setLoading(false);
                    }
                },
                []
            );


        const createOrganizationalUnit =
            useCallback(
                async (
                    request:
                        CreateOrganizationalUnitRequest
                ): Promise<
                    OrganizationalUnit | null
                > => {
                    setCreating(true);
                    setError(null);

                    try {
                        const data =
                            await organizationalUnitsService
                                .create(
                                    request
                                );

                        await refresh();

                        return data;
                    } catch (error) {
                        setError(
                            getApiErrorMessage(
                                error,
                                "No fue posible crear la unidad organizacional."
                            )
                        );

                        return null;
                    } finally {
                        setCreating(false);
                    }
                },
                [refresh]
            );


        useEffect(() => {
            void refresh();
        }, [refresh]);


        return {
            organizationalUnits,

            loading,
            creating,

            error,

            refresh,
            createOrganizationalUnit,
        };
    };