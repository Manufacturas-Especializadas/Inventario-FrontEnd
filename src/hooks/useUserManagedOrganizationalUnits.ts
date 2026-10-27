import { useEffect, useRef, useState } from "react";
import { usersService } from "../api/services/UsersService";
import { organizationalUnitsService } from "../api/services/OrganizationalUnitsService";
import type { OrganizationalUnit } from "../types/types";
import { getApiErrorMessage } from "../utils/utils";

export const useUserManagedOrganizationalUnits = (userId: number) => {
    const [units, setUnits] = useState<OrganizationalUnit[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [revision, setRevision] = useState(0);
    const submitting = useRef(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            organizationalUnitsService.getAll(),
            usersService.getManagedOrganizationalUnits(userId),
        ]).then(([catalog, assigned]) => {
            if (cancelled) return;
            setUnits(catalog);
            setSelectedIds(assigned.map((unit) => unit.id));
            setLoaded(true);
        }).catch((error: unknown) => {
            if (!cancelled) setError(getApiErrorMessage(error, "No fue posible cargar las unidades administradas."));
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [userId, revision]);

    const reload = () => {
        setLoading(true);
        setLoaded(false);
        setError(null);
        setRevision((value) => value + 1);
    };

    const save = async (): Promise<boolean> => {
        if (submitting.current || loading || !loaded) return false;
        submitting.current = true;
        setSaving(true);
        setError(null);
        try {
            await usersService.setManagedOrganizationalUnits(userId, selectedIds);
            return true;
        } catch (error) {
            setError(getApiErrorMessage(error, "No fue posible guardar las unidades administradas."));
            return false;
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    return { units, selectedIds, setSelectedIds, loading, saving, loaded, error, reload, save };
};
