import {
    useCallback,
    useState,
} from "react";

import {
    employeesService,
} from "../api/services/EmployeesService";

import type {
    Employee,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";

export const useEmployeeLookup = () => {
    const [
        employee,
        setEmployee,
    ] = useState<Employee | null>(
        null
    );

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

    const getByEmployeeNumber =
        useCallback(
            async (
                employeeNumber: string
            ): Promise<Employee | null> => {
                const normalizedEmployeeNumber =
                    employeeNumber.trim();

                if (!normalizedEmployeeNumber) {
                    setEmployee(null);
                    setError(
                        "Ingresa un número de empleado."
                    );

                    return null;
                }

                setLoading(true);
                setError(null);
                setEmployee(null);

                try {
                    const data =
                        await employeesService
                            .getByEmployeeNumber(
                                normalizedEmployeeNumber
                            );

                    setEmployee(data);

                    return data;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible encontrar al empleado."
                        )
                    );

                    return null;
                } finally {
                    setLoading(false);
                }
            },
            []
        );

    const clearEmployee =
        useCallback(() => {
            setEmployee(null);
            setError(null);
        }, []);

    return {
        employee,
        loading,
        error,

        getByEmployeeNumber,
        clearEmployee,
    };
};