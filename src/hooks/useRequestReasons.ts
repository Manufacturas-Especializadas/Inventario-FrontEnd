import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    requestReasonsService,
} from "../api/services/RequestReasonsService";

import type {
    RequestReason,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

interface UseRequestReasonsOptions {
    autoLoad?: boolean;
}

export const useRequestReasons = ({ autoLoad = true }: UseRequestReasonsOptions = {}) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const [
        requestReasons,
        setRequestReasons,
    ] = useState<RequestReason[]>([]);

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

    const getRequestReasons =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await requestReasonsService
                        .getAll();

                setRequestReasons(data);
                setHasLoaded(true);
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible cargar los motivos de solicitud."
                    )
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        if (autoLoad) void getRequestReasons();
    }, [autoLoad, getRequestReasons]);

    return {
        requestReasons,
        hasLoaded,
        loading,
        error,

        refresh:
            getRequestReasons,
    };
};