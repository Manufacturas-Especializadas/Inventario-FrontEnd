import {
    useCallback,
    useEffect,
    useRef,
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


interface UseEmployeesOptions {
    autoLoad?: boolean;
}

export const useEmployees = ({ autoLoad = true }: UseEmployeesOptions = {}) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const pendingRequest = useRef<Promise<Employee[]> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, Employee>());

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


    const refresh = useCallback((): Promise<Employee[]> => {
        if (pendingRequest.current) return pendingRequest.current;
        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();
        const request = (async () => {
            try {
                const data = await employeesService.getAll();
                const merged = new Map(data.map((employee) => [employee.id, employee]));
                updatesDuringLoad.current.forEach((employee) => merged.set(employee.id, employee));
                const result = Array.from(merged.values());
                setEmployees(result);
                setHasLoaded(true);
                return result;
            } catch (error) {
                setError(getApiErrorMessage(error, "No fue posible consultar los empleados."));
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

                    if (pendingRequest.current) updatesDuringLoad.current.set(employee.id, employee);
                    setEmployees(
                        (current) =>
                            [
                                ...current.filter((item) => item.id !== employee.id),
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

                    if (pendingRequest.current) updatesDuringLoad.current.set(employee.id, employee);
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

                    if (pendingRequest.current) updatesDuringLoad.current.set(employee.id, employee);
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
        if (autoLoad) void refresh();
    }, [autoLoad, refresh]);


    return {
        employees,
        hasLoaded,

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
