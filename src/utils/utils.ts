import axios from "axios";

import type {
    ApiProblemDetails,
} from "../types/types";

export const getApiErrorMessage = (
    error: unknown,
    fallbackMessage =
        "Ocurrió un error inesperado."
): string => {
    if (!axios.isAxiosError(error)) {
        return fallbackMessage;
    }

    const data =
        error.response
            ?.data as ApiProblemDetails | undefined;

    if (!data) {
        return fallbackMessage;
    }

    if (data.errors) {
        const firstError =
            Object.values(data.errors)
                .flat()
                .find(Boolean);

        if (firstError) {
            return firstError;
        }
    }

    if (data.detail) {
        return data.detail;
    }

    if (data.message) {
        return data.message;
    }

    if (data.title) {
        return data.title;
    }

    return fallbackMessage;
};