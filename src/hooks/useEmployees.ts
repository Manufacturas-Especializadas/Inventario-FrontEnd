import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    employeesService,
} from "../api/services/EmployeesService";

import type {
    CreateEmployeeRequest,
    Employee,
    UpdateEmployeeRequest,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


export const useEmployees = () => {
    const [
        employees,
        setEmployees,
    ] = useState<Employee[]>([]);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        changingStatusId,
        setChangingStatusId,
    ] = useState<number | null>(
        null
    );

    const [
        error,
        setError,
    ] = useState<string | null>(
        null
    );


    const refresh =
        useCallback(async () => {
            setLoading(true);
            setError(null);

            try {
                const data =
                    await employeesService
                        .getAll();

                setEmployees(
                    data
                );

                return data;
            } catch (error) {
                setError(
                    getApiErrorMessage(
                        error,
                        "No fue posible consultar los empleados."
                    )
                );

                return [];
            } finally {
                setLoading(false);
            }
        }, []);


    const createEmployee =
        useCallback(
            async (
                request:
                    CreateEmployeeRequest
            ): Promise<Employee | null> => {
                setSaving(true);
                setError(null);

                try {
                    const employee =
                        await employeesService
                            .create(
                                request
                            );

                    setEmployees(
                        (current) =>
                            [
                                ...current,
                                employee,
                            ].sort(
                                (a, b) =>
                                    a.name.localeCompare(
                                        b.name,
                                        "es"
                                    )
                            )
                    );

                    return employee;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible crear el empleado."
                        )
                    );

                    return null;
                } finally {
                    setSaving(false);
                }
            },
            []
        );


    const updateEmployee =
        useCallback(
            async (
                request:
                    UpdateEmployeeRequest
            ): Promise<Employee | null> => {
                setSaving(true);
                setError(null);

                try {
                    const employee =
                        await employeesService
                            .update(
                                request
                            );

                    setEmployees(
                        (current) =>
                            current
                                .map(
                                    (item) =>
                                        item.id ===
                                            employee.id
                                            ? employee
                                            : item
                                )
                                .sort(
                                    (a, b) =>
                                        a.name.localeCompare(
                                            b.name,
                                            "es"
                                        )
                                )
                    );

                    return employee;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar el empleado."
                        )
                    );

                    return null;
                } finally {
                    setSaving(false);
                }
            },
            []
        );


    const setEmployeeStatus =
        useCallback(
            async (
                employeeId: number,
                isActive: boolean
            ): Promise<Employee | null> => {
                setChangingStatusId(
                    employeeId
                );

                setError(null);

                try {
                    const employee =
                        await employeesService
                            .setStatus(
                                employeeId,
                                {
                                    isActive,
                                }
                            );

                    setEmployees(
                        (current) =>
                            current.map(
                                (item) =>
                                    item.id ===
                                        employee.id
                                        ? employee
                                        : item
                            )
                    );

                    return employee;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            isActive
                                ? "No fue posible activar el empleado."
                                : "No fue posible desactivar el empleado."
                        )
                    );

                    return null;
                } finally {
                    setChangingStatusId(
                        null
                    );
                }
            },
            []
        );


    const clearError =
        useCallback(() => {
            setError(null);
        }, []);


    useEffect(() => {
        void refresh();
    }, [refresh]);


    return {
        employees,

        loading,
        saving,
        changingStatusId,

        error,

        refresh,

        createEmployee,
        updateEmployee,
        setEmployeeStatus,

        clearError,
    };
};