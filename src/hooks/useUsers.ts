import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    usersService,
} from "../api/services/UsersService";

import type {
    AdminUser,
    CreateUserRequest,
    SetUserRolesRequest,
    UpdateUserRequest,
} from "../types/types";

import {
    getApiErrorMessage,
} from "../utils/utils";


interface UseUsersOptions {
    autoLoad?: boolean;
}

const sortUsers = (
    items: AdminUser[]
) => {
    return [...items].sort(
        (a, b) =>
            a.employeeName.localeCompare(
                b.employeeName,
                "es"
            ) ||
            a.username.localeCompare(
                b.username,
                "es"
            )
    );
};

export const useUsers = ({ autoLoad = true }: UseUsersOptions = {}) => {
    const [hasLoaded, setHasLoaded] = useState(false);
    const loaded = useRef(false);
    const pendingRequest = useRef<Promise<AdminUser[]> | null>(null);
    const updatesDuringLoad = useRef(new Map<number, AdminUser>());
    const mutationInFlight = useRef(false);
    const pendingCreatedId = useRef<number | null>(null);
    const reconciledCreatedUser = useRef<AdminUser | null>(null);
    const [unverifiedUserId, setUnverifiedUserId] = useState<number | null>(null);
    const [creationWarning, setCreationWarning] = useState<string | null>(null);
    const [mutationError, setMutationError] = useState<string | null>(null);

    const [
        users,
        setUsers,
    ] = useState<AdminUser[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        creating,
        setCreating,
    ] = useState(false);


    const [
        updatingId,
        setUpdatingId,
    ] = useState<number | null>(
        null
    );


    const [
        changingRolesId,
        setChangingRolesId,
    ] = useState<number | null>(
        null
    );


    const [
        resettingPasswordId,
        setResettingPasswordId,
    ] = useState<number | null>(
        null
    );


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


    const upsertUser = useCallback((user: AdminUser) => {
        if (pendingRequest.current) updatesDuringLoad.current.set(user.id, user);
        if (!loaded.current) return;
        setUsers((current) => sortUsers([
            ...current.filter((entry) => entry.id !== user.id), user,
        ]));
    }, []);

    const refresh = useCallback((): Promise<AdminUser[]> => {
        if (pendingRequest.current) return pendingRequest.current;
        setLoading(true);
        setError(null);
        updatesDuringLoad.current.clear();
        const request = (async () => {
            try {
                const data = await usersService.getAll();
                const merged = new Map(data.map((user) => [user.id, user]));
                updatesDuringLoad.current.forEach((user) => merged.set(user.id, user));
                const sorted = sortUsers(Array.from(merged.values()));
                setUsers(sorted);
                loaded.current = true;
                setHasLoaded(true);
                if (pendingCreatedId.current !== null && merged.has(pendingCreatedId.current)) {
                    reconciledCreatedUser.current = merged.get(pendingCreatedId.current) ?? null;
                    pendingCreatedId.current = null;
                    setUnverifiedUserId(null);
                    setCreationWarning(null);
                }
                return sorted;
            } catch (error) {
                setError(getApiErrorMessage(error, "No fue posible consultar los usuarios."));
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

    // POST only returns userId. Keep an unresolved creation separate from a failed POST.
    const loadCreatedUser = useCallback(async (id: number): Promise<AdminUser | null> => {
        try {
            const user = await usersService.getById(id);
            upsertUser(user);
            pendingCreatedId.current = null;
            setUnverifiedUserId(null);
            setCreationWarning(null);
            return user;
        } catch {
            // An explicit list refresh may have recovered the real DTO while detail was pending.
            if (reconciledCreatedUser.current?.id === id) return reconciledCreatedUser.current;
            setCreationWarning("El usuario fue creado, pero no fue posible recuperar su información. Reintenta consultar el detalle o actualiza la lista para verificarlo. No vuelvas a crear la cuenta.");
            return null;
        }
    }, [upsertUser]);

    const createUser = useCallback(async (request: CreateUserRequest): Promise<AdminUser | null> => {
        if (mutationInFlight.current || pendingCreatedId.current !== null) return null;
        mutationInFlight.current = true;
        setCreating(true);
        setMutationError(null);
        reconciledCreatedUser.current = null;
        try {
            const created = await usersService.create(request);
            pendingCreatedId.current = created.userId;
            setUnverifiedUserId(created.userId);
            return await loadCreatedUser(created.userId);
        } catch (error) {
            setMutationError(getApiErrorMessage(error, "No fue posible crear el usuario."));
            return null;
        } finally {
            mutationInFlight.current = false;
            setCreating(false);
        }
    }, [loadCreatedUser]);

    const retryCreatedUser = useCallback(async (): Promise<AdminUser | null> => {
        const id = pendingCreatedId.current;
        if (id === null || mutationInFlight.current) return null;
        mutationInFlight.current = true;
        setCreating(true);
        try {
            return await loadCreatedUser(id);
        } finally {
            mutationInFlight.current = false;
            setCreating(false);
        }
    }, [loadCreatedUser]);

    const updateUser =
        useCallback(
            async (
                id: number,
                request:
                    UpdateUserRequest
            ): Promise<AdminUser | null> => {
                if (mutationInFlight.current) return null;
                mutationInFlight.current = true;
                setUpdatingId(
                    id
                );

                setMutationError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .update(
                                id,
                                request
                            );


                    upsertUser(user);


                    return user;
                } catch (error) {
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar el usuario."
                        )
                    );

                    return null;
                } finally {
                    mutationInFlight.current = false;
                    setUpdatingId(
                        null
                    );
                }
            },
            [upsertUser]
        );


    const setUserRoles =
        useCallback(
            async (
                id: number,
                request:
                    SetUserRolesRequest
            ): Promise<AdminUser | null> => {
                if (mutationInFlight.current) return null;
                mutationInFlight.current = true;
                setChangingRolesId(
                    id
                );

                setMutationError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .setRoles(
                                id,
                                request
                            );


                    upsertUser(user);


                    return user;
                } catch (error) {
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar los roles del usuario."
                        )
                    );

                    return null;
                } finally {
                    mutationInFlight.current = false;
                    setChangingRolesId(
                        null
                    );
                }
            },
            [upsertUser]
        );


    const resetUserPassword =
        useCallback(
            async (
                id: number,
                newPassword: string
            ): Promise<AdminUser | null> => {
                if (mutationInFlight.current) return null;
                if (
                    newPassword.length <
                    8 ||
                    newPassword.length >
                    64
                ) {
                    setMutationError(
                        "La contraseña debe tener entre 8 y 64 caracteres."
                    );

                    return null;
                }


                mutationInFlight.current = true;
                setResettingPasswordId(
                    id
                );

                setMutationError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .resetPassword(
                                id,
                                {
                                    newPassword,
                                }
                            );


                    upsertUser(user);


                    return user;
                } catch (error) {
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            "No fue posible restablecer la contraseña."
                        )
                    );

                    return null;
                } finally {
                    mutationInFlight.current = false;
                    setResettingPasswordId(
                        null
                    );
                }
            },
            [upsertUser]
        );


    const setUserStatus =
        useCallback(
            async (
                id: number,
                isActive: boolean
            ): Promise<AdminUser | null> => {
                if (mutationInFlight.current) return null;
                mutationInFlight.current = true;
                setChangingStatusId(
                    id
                );

                setMutationError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .setStatus(
                                id,
                                {
                                    isActive,
                                }
                            );


                    upsertUser(user);


                    return user;
                } catch (error) {
                    setMutationError(
                        getApiErrorMessage(
                            error,
                            isActive
                                ? "No fue posible activar el usuario."
                                : "No fue posible desactivar el usuario."
                        )
                    );

                    return null;
                } finally {
                    mutationInFlight.current = false;
                    setChangingStatusId(
                        null
                    );
                }
            },
            [upsertUser]
        );


    const clearError =
        useCallback(() => {
            setMutationError(
                null
            );
        }, []);


    useEffect(() => {
        if (autoLoad) void refresh();
    }, [autoLoad, refresh]);


    return {
        users,
        hasLoaded,
        mutationError,
        creationWarning,
        unverifiedUserId,
        retryCreatedUser,

        loading,
        creating,

        updatingId,
        changingRolesId,
        resettingPasswordId,
        changingStatusId,

        error,

        refresh,

        createUser,
        updateUser,
        setUserRoles,
        resetUserPassword,
        setUserStatus,

        clearError,
    };
};
