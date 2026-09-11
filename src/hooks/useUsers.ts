import {
    useCallback,
    useEffect,
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


export const useUsers = () => {
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


    const replaceUser = (
        current: AdminUser[],
        updatedUser: AdminUser
    ) => {
        return sortUsers(
            current.map(
                (user) =>
                    user.id ===
                        updatedUser.id
                        ? updatedUser
                        : user
            )
        );
    };


    const refresh =
        useCallback(
            async (): Promise<
                AdminUser[]
            > => {
                setLoading(true);
                setError(null);

                try {
                    const data =
                        await usersService
                            .getAll();

                    const sorted =
                        sortUsers(
                            data
                        );

                    setUsers(
                        sorted
                    );

                    return sorted;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible consultar los usuarios."
                        )
                    );

                    return [];
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            []
        );


    const createUser =
        useCallback(
            async (
                request:
                    CreateUserRequest
            ): Promise<AdminUser | null> => {
                setCreating(
                    true
                );

                setError(
                    null
                );

                try {
                    const created =
                        await usersService
                            .create(
                                request
                            );


                    /*
                     * POST /users solamente
                     * devuelve userId.
                     *
                     * Consultamos el usuario
                     * recién creado para obtener
                     * el AdminUser completo.
                     */
                    const user =
                        await usersService
                            .getById(
                                created.userId
                            );


                    setUsers(
                        (current) =>
                            sortUsers([
                                ...current,
                                user,
                            ])
                    );


                    return user;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible crear el usuario."
                        )
                    );

                    return null;
                } finally {
                    setCreating(
                        false
                    );
                }
            },
            []
        );


    const updateUser =
        useCallback(
            async (
                id: number,
                request:
                    UpdateUserRequest
            ): Promise<AdminUser | null> => {
                setUpdatingId(
                    id
                );

                setError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .update(
                                id,
                                request
                            );


                    setUsers(
                        (current) =>
                            replaceUser(
                                current,
                                user
                            )
                    );


                    return user;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar el usuario."
                        )
                    );

                    return null;
                } finally {
                    setUpdatingId(
                        null
                    );
                }
            },
            []
        );


    const setUserRoles =
        useCallback(
            async (
                id: number,
                request:
                    SetUserRolesRequest
            ): Promise<AdminUser | null> => {
                setChangingRolesId(
                    id
                );

                setError(
                    null
                );

                try {
                    const user =
                        await usersService
                            .setRoles(
                                id,
                                request
                            );


                    setUsers(
                        (current) =>
                            replaceUser(
                                current,
                                user
                            )
                    );


                    return user;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible actualizar los roles del usuario."
                        )
                    );

                    return null;
                } finally {
                    setChangingRolesId(
                        null
                    );
                }
            },
            []
        );


    const resetUserPassword =
        useCallback(
            async (
                id: number,
                newPassword: string
            ): Promise<AdminUser | null> => {
                if (
                    newPassword.length <
                    8 ||
                    newPassword.length >
                    64
                ) {
                    setError(
                        "La contraseña debe tener entre 8 y 64 caracteres."
                    );

                    return null;
                }


                setResettingPasswordId(
                    id
                );

                setError(
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


                    setUsers(
                        (current) =>
                            replaceUser(
                                current,
                                user
                            )
                    );


                    return user;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            "No fue posible restablecer la contraseña."
                        )
                    );

                    return null;
                } finally {
                    setResettingPasswordId(
                        null
                    );
                }
            },
            []
        );


    const setUserStatus =
        useCallback(
            async (
                id: number,
                isActive: boolean
            ): Promise<AdminUser | null> => {
                setChangingStatusId(
                    id
                );

                setError(
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


                    setUsers(
                        (current) =>
                            replaceUser(
                                current,
                                user
                            )
                    );


                    return user;
                } catch (error) {
                    setError(
                        getApiErrorMessage(
                            error,
                            isActive
                                ? "No fue posible activar el usuario."
                                : "No fue posible desactivar el usuario."
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
            setError(
                null
            );
        }, []);


    useEffect(() => {
        void refresh();
    }, [refresh]);


    return {
        users,

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