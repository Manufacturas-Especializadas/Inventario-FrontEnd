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
    const loaded = useRef(false);
    const savingRequest = useRef(false);
    const pendingMutations = useRef(new Set<number>());
    const [mutationError, setMutationError] = useState<string | null>(null);
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

    const [changingStatusIds, setChangingStatusIds] = useState<Set<number>>(() => new Set());

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
                loaded.current = true;
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
                if (savingRequest.current) return null;
                savingRequest.current = true;
                setSaving(true);
                setMutationError(null);

                try {
                    const employee =
                        await employeesService
                            .create(
                                request
                            );

                    if (pendingRequest.current) updatesDuringLoad.current.set(employee.id, employee);
                    if (loaded.current) setEmployees(
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
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            "No fue posible crear el empleado."
                        )
                    );

                    return null;
                } finally {
                    savingRequest.current = false;
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
                if (savingRequest.current || pendingMutations.current.has(request.id)) return null;
                savingRequest.current = true;
                pendingMutations.current.add(request.id);
                setSaving(true);
                setMutationError(null);

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
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar el empleado."
                        )
                    );

                    return null;
                } finally {
                    savingRequest.current = false;
                    pendingMutations.current.delete(request.id);
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
                if (pendingMutations.current.has(employeeId)) return null;
                pendingMutations.current.add(employeeId);
                setChangingStatusIds((current) => new Set(current).add(employeeId));

                setMutationError(null);

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
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            isActive
                                ? "No fue posible activar el empleado."
                                : "No fue posible desactivar el empleado."
                        )
                    );

                    return null;
                } finally {
                    pendingMutations.current.delete(employeeId);
                    setChangingStatusIds((current) => {
                        const next = new Set(current);
                        next.delete(employeeId);
                        return next;
                    });
                }
            },
            []
        );


    const clearError =
        useCallback(() => {
            setMutationError(null);
        }, []);


    useEffect(() => {
        if (autoLoad) void refresh();
    }, [autoLoad, refresh]);


    return {
        employees,
        hasLoaded,

        loading,
        saving,
        changingStatusIds,
        changingStatusId: changingStatusIds.values().next().value ?? null,

        error,
        mutationError,

        refresh,

        createEmployee,
        updateEmployee,
        setEmployeeStatus,

        clearError,
    };
};
